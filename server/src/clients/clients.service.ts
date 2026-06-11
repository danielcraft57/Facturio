import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';
import type { ClientListQueryDto } from './dto/client-list-query.dto';
import {
	buildClientFolderWhere,
	type ClientFolder,
} from './client-folder.util';
import { CatalogPersonalizationService } from '../catalog/catalog-personalization.service';
import { groupByYearAndMonth } from '../common/archive-group.util';

/**
 * Service de gestion des clients
 * 
 * Gère le CRUD complet des clients avec :
 * - Validation des données (nom, email)
 * - Filtrage multi-tenant par organizationId
 * - Pagination, recherche et tri
 * - Gestion des taux de TVA personnalisés
 * 
 * @see ClientsController pour les endpoints API
 */
@Injectable()
export class ClientsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly catalogPersonalization: CatalogPersonalizationService,
	) {}

	/**
	 * Crée un nouveau client
	 * 
	 * Valide :
	 * - Le nom (obligatoire)
	 * - L'email (obligatoire, format valide)
	 * 
	 * @param data - Données du client
	 * @param organizationId - ID de l'organisation (pour multi-tenant)
	 * @returns Client créé
	 * @throws {BadRequestException} Si validation échoue
	 * 
	 * @example
	 * ```typescript
	 * const client = await clientsService.create({
	 *   name: 'Acme Corp',
	 *   email: 'contact@acme.com',
	 *   isCompany: true,
	 *   countryCode: 'FR'
	 * }, 1);
	 * ```
	 */
	async create(
		data: CreateClientDto,
		organizationId?: number,
		options?: { reuseExistingEmail?: boolean },
	) {
		// Validation nom
		if (!data.name) {
			throw new BadRequestException('Le nom est requis');
		}
		// Validation email
		if (!data.email) {
			throw new BadRequestException('Email requis');
		}
		const email = data.email.trim();
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			throw new BadRequestException('Email invalide');
		}

		const existing = await this.prisma.client.findUnique({ where: { email } });
		if (existing) {
			if (
				organizationId != null &&
				existing.organizationId != null &&
				existing.organizationId !== organizationId
			) {
				throw new ConflictException(
					'Cet email est déjà utilisé par un client d\'une autre organisation.',
				);
			}
			if (options?.reuseExistingEmail) {
				if (organizationId != null && existing.organizationId == null) {
					return this.prisma.client.update({
						where: { id: existing.id },
						data: { organizationId, name: data.name.trim() },
					});
				}
				return existing;
			}
			throw new ConflictException('Un client avec cet email existe déjà.');
		}

		const { technologyIds, ...rest } = data;
		const cleanData: Record<string, unknown> = {
			...rest,
			email,
			taxRateOverrideId: data.taxRateOverrideId || undefined,
		};

		if (organizationId) {
			cleanData.organizationId = organizationId;
		}

		const client = await this.prisma.client.create({ data: cleanData as never });

		if (technologyIds?.length) {
			try {
				await this.catalogPersonalization.assignClientCatalog(
					client.id,
					technologyIds,
					'client_create',
				);
			} catch {
				// catalogue optionnel
			}
		}

		return client;
	}

	/**
	 * Liste les clients avec pagination, recherche et tri
	 * 
	 * @param query - Paramètres de pagination/recherche/tri
	 * @param organizationId - ID de l'organisation (filtre multi-tenant)
	 * @returns Liste paginée de clients
	 * 
	 * @example
	 * ```typescript
	 * const result = await clientsService.findAll({
	 *   page: 1,
	 *   pageSize: 20,
	 *   search: 'Acme',
	 *   sortBy: 'name',
	 *   order: 'asc'
	 * }, 1);
	 * // result = { items: [...], total: 50, page: 1, pageSize: 20 }
	 * ```
	 */
	async findAll(query: ClientListQueryDto | ListQueryDto, organizationId?: number) {
		const q = query as ClientListQueryDto;
		const page = query.page ? parseInt(query.page.toString(), 10) : 1;
		const pageSize = query.pageSize ? parseInt(query.pageSize.toString(), 10) : (query.limit ? parseInt(query.limit.toString(), 10) : 20);
		const skip = (page - 1) * pageSize;
		const where: Record<string, unknown> = {};

		if (query.search) {
			where.OR = [
				{ name: { contains: query.search } },
				{ email: { contains: query.search } },
				{ companyName: { contains: query.search } },
				{ siren: { contains: query.search } },
			];
		}

		Object.assign(where, buildClientFolderWhere(q.folder));

		if (organizationId) {
			where.organizationId = organizationId;
		}

		const [items, total] = await this.prisma.$transaction([
			this.prisma.client.findMany({
				skip,
				take: pageSize,
				where: where as any,
				orderBy: query.sortBy
					? { [query.sortBy]: (query.order ?? 'desc') as any }
					: { createdAt: 'desc' },
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
					address: true,
					companyName: true,
					siren: true,
					vatNumber: true,
					countryCode: true,
					isCompany: true,
					status: true,
					archivedAt: true,
					createdAt: true,
					updatedAt: true,
					_count: { select: { invoices: true, quotes: true } },
				},
			}),
			this.prisma.client.count({ where: where as any }),
		]);

		const clientIds = items.map((c) => c.id);
		const [invoiceStats, folderCounts] = await Promise.all([
			clientIds.length > 0
				? this.loadInvoiceStatsForClients(clientIds, organizationId)
				: Promise.resolve(
						new Map<string, { revenueTotal: number; lastInvoiceAt: string | null }>(),
					),
			q.includeFolderCounts && page === 1
				? this.loadFolderCounts(organizationId)
				: Promise.resolve(null),
		]);

		const enriched = items.map((c) => {
			const stats = invoiceStats.get(c.id);
			return {
				...c,
				revenueTotal: stats?.revenueTotal ?? 0,
				lastInvoiceAt: stats?.lastInvoiceAt ?? null,
			};
		});

		return {
			items: enriched,
			total,
			page,
			pageSize,
			...(folderCounts ? { folderCounts } : {}),
		};
	}

	private async loadFolderCounts(organizationId?: number) {
		const base: Record<string, unknown> = {};
		if (organizationId) base.organizationId = organizationId;

		const count = (folder: ClientFolder) =>
			this.prisma.client.count({
				where: { ...base, ...buildClientFolderWhere(folder) } as any,
			});

		const [inbox, actifs, inactifs, prospects, entreprises, particuliers, archives] =
			await Promise.all([
				count('inbox'),
				count('actifs'),
				count('inactifs'),
				count('prospects'),
				count('entreprises'),
				count('particuliers'),
				count('archives'),
			]);

		return { inbox, actifs, inactifs, prospects, entreprises, particuliers, archives };
	}

	/** CA payé + dernière facture (page courante) — groupBy Prisma (compatible SQLite/Postgres, évite bug Decimal→BigInt du raw SQL). */
	private async loadInvoiceStatsForClients(
		clientIds: string[],
		organizationId?: number,
	) {
		const invoiceWhere: Record<string, unknown> = {
			clientId: { in: clientIds },
			status: { not: 'CANCELLED' },
		};
		if (organizationId) invoiceWhere.organizationId = organizationId;

		const [paidTotals, lastInvoices] = await Promise.all([
			this.prisma.invoice.groupBy({
				by: ['clientId'],
				where: { ...invoiceWhere, status: 'PAID' } as any,
				_sum: { total: true },
			}),
			this.prisma.invoice.groupBy({
				by: ['clientId'],
				where: invoiceWhere as any,
				_max: { date: true },
			}),
		]);

		const map = new Map<string, { revenueTotal: number; lastInvoiceAt: string | null }>();
		for (const row of paidTotals) {
			map.set(row.clientId, {
				revenueTotal: Number(row._sum.total ?? 0),
				lastInvoiceAt: null,
			});
		}
		for (const row of lastInvoices) {
			const existing = map.get(row.clientId) ?? {
				revenueTotal: 0,
				lastInvoiceAt: null,
			};
			map.set(row.clientId, {
				...existing,
				lastInvoiceAt: row._max.date?.toISOString() ?? null,
			});
		}
		return map;
	}

	async getFolderCounts(organizationId?: number) {
		return this.loadFolderCounts(organizationId);
	}

	/**
	 * Récupère un client par ID
	 * 
	 * @param id - ID du client
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Client trouvé
	 * @throws {NotFoundException} Si client non trouvé ou n'appartient pas à l'organisation
	 */
	async findOne(id: string, organizationId?: number) {
		const where: any = { id };
		if (organizationId) {
			where.organizationId = organizationId;
		}
		const client = await this.prisma.client.findUnique({ where });
		if (!client) throw new NotFoundException('Client non trouve');
		return client;
	}

	/**
	 * Met à jour un client
	 * 
	 * @param id - ID du client
	 * @param data - Données de mise à jour (tous les champs optionnels)
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Client mis à jour
	 * @throws {NotFoundException} Si client non trouvé
	 */
	async update(id: string, data: UpdateClientDto, organizationId?: number) {
		await this.findOne(id, organizationId);
		
		// Nettoyer les données pour Prisma
		const cleanData = {
			...data,
			taxRateOverrideId: data.taxRateOverrideId || undefined
		};
		
		return this.prisma.client.update({ where: { id }, data: cleanData });
	}

	/** Archive un client (aucune suppression — factures et devis conservés). */
	async archive(id: string, organizationId?: number) {
		const client = await this.findOne(id, organizationId);
		if (client.archivedAt) {
			return { success: true, alreadyArchived: true, archivedAt: client.archivedAt };
		}
		const updated = await this.prisma.client.update({
			where: { id },
			data: { archivedAt: new Date(), status: 'INACTIVE' },
		});
		return { success: true, archivedAt: updated.archivedAt };
	}

	/** Restaure un client archivé dans la liste active. */
	async restore(id: string, organizationId?: number) {
		const client = await this.findOne(id, organizationId);
		if (!client.archivedAt) {
			return { success: true, alreadyActive: true };
		}
		await this.prisma.client.update({
			where: { id },
			data: { archivedAt: null, status: 'ACTIVE' },
		});
		return { success: true };
	}

	/** Clients archivés groupés par année et mois. */
	async findArchivedGrouped(organizationId?: number) {
		const where: { archivedAt: { not: null }; organizationId?: number } = {
			archivedAt: { not: null },
		};
		if (organizationId) where.organizationId = organizationId;
		const items = await this.prisma.client.findMany({
			where,
			orderBy: { updatedAt: 'desc' },
			select: {
				id: true,
				name: true,
				email: true,
				companyName: true,
				isCompany: true,
				status: true,
				archivedAt: true,
				updatedAt: true,
			},
		});
		return {
			groups: groupByYearAndMonth(items, (c) => c.archivedAt ?? c.updatedAt),
			total: items.length,
		};
	}

	/**
	 * @deprecated Utiliser archive — conserve DELETE pour compatibilité API.
	 */
	async remove(id: string, organizationId?: number) {
		return this.archive(id, organizationId);
	}
}


