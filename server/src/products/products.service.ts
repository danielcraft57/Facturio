import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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
	constructor(private readonly prisma: PrismaService) {}

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

	create(data: CreateProductDto) {
		return this.prisma.product.create({
			data: this.toPrismaData(data),
			include: { defaultTaxRate: true },
		});
	}

	/**
	 * Liste les produits avec pagination, recherche et tri
	 * 
	 * @param query - Paramètres de pagination/recherche/tri
	 * @returns Liste paginée de produits avec taux de TVA
	 */
	async findAll(query?: ListProductsQueryDto) {
		const page = query?.page ? parseInt(query.page.toString(), 10) : 1;
		const pageSize = query?.pageSize ?? query?.limit;
		const take = pageSize != null ? parseInt(String(pageSize), 10) : 20;
		const skip = (page - 1) * take;

		const where: Prisma.ProductWhereInput = {};

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
	async findOne(id: number) {
		const product = await this.prisma.product.findUnique({ where: { id }, include: { defaultTaxRate: true } });
		if (!product) throw new NotFoundException('Produit non trouve');
		return product;
	}

	/**
	 * Met à jour un produit
	 * 
	 * @param id - ID du produit
	 * @param data - Données de mise à jour (tous les champs optionnels)
	 * @returns Produit mis à jour
	 * @throws {NotFoundException} Si produit non trouvé
	 */
	async update(id: number, data: UpdateProductDto) {
		await this.findOne(id);
		return this.prisma.product.update({
			where: { id },
			data: this.toPrismaData(data),
			include: { defaultTaxRate: true },
		});
	}

	/**
	 * Supprime un produit
	 * 
	 * @param id - ID du produit
	 * @returns Confirmation de suppression
	 * @throws {NotFoundException} Si produit non trouvé
	 */
	async remove(id: number) {
		await this.findOne(id);
		await this.prisma.product.delete({ where: { id } });
		return { success: true };
	}
}


