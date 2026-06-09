import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogPersonalizationService } from '../catalog/catalog-personalization.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import type { RealtimeAction } from '../realtime/realtime.types';
import { flattenTechAssembly } from '../catalog/tech-assembly.utils';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { resolveVisualOnCreate } from './product-visual.utils';
import { normalizeProductSku } from './product-sku.util';
import { DeliverablesCatalogService } from './deliverables-catalog.service';
import { parseProductDeliverables } from './product-deliverables.util';
import {
	formatProductForResponse,
	normalizeProductWritePayload,
} from './product-payload-normalize.util';

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
		private readonly deliverablesCatalog: DeliverablesCatalogService,
	) {}

	private async syncDeliverablesCatalog(
		organizationId: number | null | undefined,
		details: unknown,
	) {
		if (!organizationId || details === undefined) return;
		const deliverables = parseProductDeliverables(details);
		if (!deliverables.length) return;
		await this.deliverablesCatalog.syncFromDeliverables(organizationId, deliverables);
	}

	/**
	 * Crée un nouveau produit
	 * 
	 * @param data - Données du produit (nom, SKU, prix, taux TVA, etc.)
	 * @returns Produit créé avec taux de TVA par défaut
	 */
	private toPrismaData(data: ProductWriteDto): Prisma.ProductUncheckedCreateInput {
		const { languages, details, techStack, sku, visualType, iconName, imageData, ...rest } =
			data as CreateProductDto;
		const resolvedLangs =
			languages !== undefined
				? languages
				: techStack !== undefined
					? flattenTechAssembly(techStack ?? undefined)
					: undefined;
		const techStackJson: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined =
			techStack === undefined
				? undefined
				: techStack == null
					? Prisma.JsonNull
					: (techStack as Prisma.InputJsonValue);

		return {
			...rest,
			...(sku !== undefined
				? { sku: sku ? normalizeProductSku(sku) : null }
				: {}),
			...(techStackJson !== undefined ? { techStack: techStackJson } : {}),
			...(resolvedLangs !== undefined
				? { languages: (resolvedLangs ?? []) as Prisma.InputJsonValue }
				: {}),
			...(details !== undefined
				? { details: (details ?? []) as unknown as Prisma.InputJsonValue }
				: {}),
		} as Prisma.ProductUncheckedCreateInput;
	}

	private mapProductResponse<T extends { details?: unknown; techStack?: unknown; languages?: unknown }>(
		product: T,
	): T {
		return formatProductForResponse(product);
	}

	async create(data: CreateProductDto, organizationId?: number) {
		const normalized = normalizeProductWritePayload(data);
		const visual = resolveVisualOnCreate(normalized);
		const product = await this.prisma.product.create({
			data: {
				...this.toPrismaData(normalized),
				...visual,
				organizationId: organizationId ?? null,
			},
			include: { defaultTaxRate: true },
		});
		await this.syncDeliverablesCatalog(
			organizationId,
			parseProductDeliverables(normalized.details ?? product.details),
		);
		this.notifyProduct(organizationId, 'created', product.id, product.name);
		return this.mapProductResponse(product);
	}

	/** Produit catalogue de l’organisation par SKU exact (insensible à la casse côté appelant si besoin). */
	async findBySku(sku: string, organizationId: number) {
		const normalized = normalizeProductSku(sku);
		if (!normalized) return null;
		const product = await this.prisma.product.findFirst({
			where: { organizationId, sku: normalized },
			include: { defaultTaxRate: true },
		});
		return product ? this.mapProductResponse(product) : null;
	}

	/**
	 * Résout un produit par SKU dans l’organisation, ou le crée avec les champs fournis.
	 * Utilisé par les lignes de devis (productSku) sans appel produits séparé.
	 */
	async findOrCreateBySku(
		sku: string,
		organizationId: number,
		data: Pick<CreateProductDto, 'name' | 'unitPrice' | 'kind' | 'description'>,
	): Promise<Prisma.ProductGetPayload<{ include: { defaultTaxRate: true } }>> {
		const existing = await this.findBySku(sku, organizationId);
		if (existing) return this.mapProductResponse(existing);
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
			items: filtered.slice(skip, skip + take).map((p) => this.mapProductResponse(p)),
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
			items: items.map((p) => this.mapProductResponse(p)),
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
		const product = await this.assertOrgProduct(id, organizationId);
		return this.mapProductResponse(product);
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
		const normalized = normalizeProductWritePayload(data);
		const product = await this.prisma.product.update({
			where: { id },
			data: this.toPrismaData(normalized) as Prisma.ProductUncheckedUpdateInput,
			include: { defaultTaxRate: true },
		});
		await this.syncDeliverablesCatalog(
			organizationId,
			parseProductDeliverables(normalized.details ?? product.details),
		);
		this.notifyProduct(organizationId, 'updated', product.id, product.name);
		return this.mapProductResponse(product);
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


