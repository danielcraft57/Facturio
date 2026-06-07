import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogPersonalizationService } from '../catalog/catalog-personalization.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import type { RealtimeAction } from '../realtime/realtime.types';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { resolveVisualOnCreate } from './product-visual.utils';

type ProductWriteDto = CreateProductDto | UpdateProductDto;
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { Prisma } from '@prisma/client';

/**
 * Service de gestion des produits
 * 
 * Gère le CRUD complet des produits avec :
 * - Gestion des SKU (codes produits)
 * - Association avec des taux de TVA par défaut
 * - Pagination, recherche et tri
 * 
 * @see ProductsController pour les endpoints API
 */
@Injectable()
export class ProductsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly catalogPersonalization: CatalogPersonalizationService,
		private readonly realtime: RealtimeEventsService,
	) {}

	/**
	 * Crée un nouveau produit
	 * 
	 * @param data - Données du produit (nom, SKU, prix, taux TVA, etc.)
	 * @returns Produit créé avec taux de TVA par défaut
	 */
	private toPrismaData(data: ProductWriteDto) {
		const { languages, details, ...rest } = data as CreateProductDto;
		return {
			...rest,
			...(languages !== undefined ? { languages: languages ?? [] } : {}),
			...(details !== undefined ? { details: details ?? [] } : {}),
		};
	}

	async create(data: CreateProductDto, organizationId?: number) {
		const visual = resolveVisualOnCreate(data);
		const product = await this.prisma.product.create({
			data: {
				...this.toPrismaData(data),
				...visual,
				organizationId: organizationId ?? null,
			},
			include: { defaultTaxRate: true },
		});
		this.notifyProduct(organizationId, 'created', product.id, product.name);
		return product;
	}

	/** Produit catalogue de l’organisation par SKU exact (insensible à la casse côté appelant si besoin). */
	async findBySku(sku: string, organizationId: number) {
		const normalized = sku.trim();
		if (!normalized) return null;
		return this.prisma.product.findFirst({
			where: { organizationId, sku: normalized },
			include: { defaultTaxRate: true },
		});
	}

	/**
	 * Résout un produit par SKU dans l’organisation, ou le crée avec les champs fournis.
	 * Utilisé par les lignes de devis (productSku) sans appel produits séparé.
	 */
	async findOrCreateBySku(
		sku: string,
		organizationId: number,
		data: Pick<CreateProductDto, 'name' | 'unitPrice' | 'kind' | 'description'>,
	) {
		const existing = await this.findBySku(sku, organizationId);
		if (existing) return existing;
		return this.create(
			{
				name: data.name,
				sku: sku.trim(),
				kind: data.kind ?? 'SERVICE',
				unitPrice: data.unitPrice,
				description: data.description,
			},
			organizationId,
		);
	}

	private notifyProduct(
		organizationId: number | null | undefined,
		action: RealtimeAction,
		productId: number,
		name: string,
	) {
		if (!organizationId) return;
		this.realtime.emit(organizationId, 'products', action, String(productId), { number: name });
	}

	private orgProductWhere(organizationId?: number): Prisma.ProductWhereInput {
		if (!organizationId) {
			return { organizationId: null };
		}
		return { organizationId };
	}

	private async assertOrgProduct(id: number, organizationId?: number) {
		const product = await this.prisma.product.findFirst({
			where: { id, ...this.orgProductWhere(organizationId) },
			include: { defaultTaxRate: true },
		});
		if (!product) throw new NotFoundException('Produit non trouve');
		return product;
	}

	/**
	 * Liste les produits avec pagination, recherche et tri
	 * 
	 * @param query - Paramètres de pagination/recherche/tri
	 * @returns Liste paginée de produits avec taux de TVA
	 */
	async findAll(query?: ListProductsQueryDto, organizationId?: number) {
		const page = query?.page ? parseInt(query.page.toString(), 10) : 1;
		const pageSize = query?.pageSize ?? query?.limit;
		const take = pageSize != null ? parseInt(String(pageSize), 10) : 20;
		const skip = (page - 1) * take;

		const where: Prisma.ProductWhereInput = this.orgProductWhere(organizationId);

		if (query?.scope && organizationId) {
			let catalogIds: number[] = [];
			if (query.scope === 'organization') {
				catalogIds = await this.catalogPersonalization.getOrganizationCatalogProductIds(organizationId);
			} else if (query.scope === 'client' && query.clientId) {
				const client = await this.prisma.client.findFirst({
					where: { id: query.clientId, organizationId },
				});
				if (client) {
					catalogIds = await this.catalogPersonalization.getClientCatalogProductIds(query.clientId);
				}
			}
			if (catalogIds.length > 0) {
				where.id = { in: catalogIds };
			} else {
				return { items: [], total: 0, page, pageSize: take };
			}
		}

		if (query?.search) {
			where.OR = [
				{ name: { contains: query.search } },
				{ sku: { contains: query.search } },
				{ description: { contains: query.search } },
			];
		}
		if (query?.kind) where.kind = query.kind;
		if (query?.purpose) where.purpose = query.purpose;
		if (query?.category) where.category = query.category;
		if (query?.visualType) where.visualType = query.visualType;

		const orderBy = query?.sortBy
			? { [query.sortBy]: (query.order ?? 'desc') as 'asc' | 'desc' }
			: { createdAt: 'desc' as const };

		const include = { defaultTaxRate: true };

		if (query?.language) {
			const lang = query.language.toLowerCase();
			const all = await this.prisma.product.findMany({ where, orderBy, include });
			const filtered = all.filter(p => {
				const langs = Array.isArray(p.languages) ? (p.languages as string[]) : [];
				return langs.some(l => String(l).toLowerCase().includes(lang));
			});
			return {
				items: filtered.slice(skip, skip + take),
				total: filtered.length,
				page,
				pageSize: take,
			};
		}

		const [items, total] = await this.prisma.$transaction([
			this.prisma.product.findMany({ skip, take, where, orderBy, include }),
			this.prisma.product.count({ where }),
		]);

		return {
			items,
			total,
			page,
			pageSize: take,
		};
	}

	/**
	 * Récupère un produit par ID
	 * 
	 * @param id - ID du produit
	 * @returns Produit avec taux de TVA par défaut
	 * @throws {NotFoundException} Si produit non trouvé
	 */
	async findOne(id: number, organizationId?: number) {
		return this.assertOrgProduct(id, organizationId);
	}

	/**
	 * Met à jour un produit
	 * 
	 * @param id - ID du produit
	 * @param data - Données de mise à jour (tous les champs optionnels)
	 * @returns Produit mis à jour
	 * @throws {NotFoundException} Si produit non trouvé
	 */
	async update(id: number, data: UpdateProductDto, organizationId?: number) {
		await this.assertOrgProduct(id, organizationId);
		const product = await this.prisma.product.update({
			where: { id },
			data: this.toPrismaData(data),
			include: { defaultTaxRate: true },
		});
		this.notifyProduct(organizationId, 'updated', product.id, product.name);
		return product;
	}

	/**
	 * Supprime un produit
	 * 
	 * @param id - ID du produit
	 * @returns Confirmation de suppression
	 * @throws {NotFoundException} Si produit non trouvé
	 */
	async remove(id: number, organizationId?: number) {
		const existing = await this.assertOrgProduct(id, organizationId);
		await this.prisma.product.delete({ where: { id } });
		this.notifyProduct(organizationId, 'deleted', id, existing.name);
		return { success: true };
	}
}


