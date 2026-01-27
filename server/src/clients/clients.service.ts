import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ListQueryDto } from '../common/dto/list-query.dto';

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
	constructor(private readonly prisma: PrismaService) {}

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
	async create(data: CreateClientDto, organizationId?: number) {
		// Validation nom
		if (!data.name) {
			throw new BadRequestException('Le nom est requis');
		}
		// Validation email
		if (!data.email) {
			throw new BadRequestException('Email requis');
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(data.email)) {
			throw new BadRequestException('Email invalide');
		}
		
		// Nettoyer les données pour Prisma
		const cleanData: any = {
			...data,
			taxRateOverrideId: data.taxRateOverrideId || undefined
		};
		
		// Ajouter organizationId si fourni (pour compatibilité multi-tenant)
		if (organizationId) {
			cleanData.organizationId = organizationId;
		}
		
		return this.prisma.client.create({ data: cleanData });
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
	async findAll(query: ListQueryDto, organizationId?: number) {
		const page = query.page ? parseInt(query.page.toString(), 10) : 1;
		const pageSize = query.pageSize ? parseInt(query.pageSize.toString(), 10) : (query.limit ? parseInt(query.limit.toString(), 10) : 20);
		const skip = (page - 1) * pageSize;
		const where: any = query.search
			? {
				OR: [
					{ name: { contains: query.search } },
					{ email: { contains: query.search } },
					{ companyName: { contains: query.search } }
				]
			}
			: {};
		
		// Filtrer par organisation si fournie
		if (organizationId) {
			where.organizationId = organizationId;
		}
		const [items, total] = await this.prisma.$transaction([
			this.prisma.client.findMany({
				skip,
				take: pageSize,
				where,
				orderBy: query.sortBy
					? { [query.sortBy]: (query.order ?? 'desc') as any }
					: { createdAt: 'desc' }
			}),
			this.prisma.client.count({ where })
		]);
		return { items, total, page, pageSize };
	}

	/**
	 * Récupère un client par ID
	 * 
	 * @param id - ID du client
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Client trouvé
	 * @throws {NotFoundException} Si client non trouvé ou n'appartient pas à l'organisation
	 */
	async findOne(id: number, organizationId?: number) {
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
	async update(id: number, data: UpdateClientDto, organizationId?: number) {
		await this.findOne(id, organizationId);
		
		// Nettoyer les données pour Prisma
		const cleanData = {
			...data,
			taxRateOverrideId: data.taxRateOverrideId || undefined
		};
		
		return this.prisma.client.update({ where: { id }, data: cleanData });
	}

	/**
	 * Supprime un client
	 * 
	 * @param id - ID du client
	 * @param organizationId - ID de l'organisation (vérification multi-tenant)
	 * @returns Confirmation de suppression
	 * @throws {NotFoundException} Si client non trouvé
	 */
	async remove(id: number, organizationId?: number) {
		await this.findOne(id, organizationId);
		await this.prisma.client.delete({ where: { id } });
		return { success: true };
	}
}


