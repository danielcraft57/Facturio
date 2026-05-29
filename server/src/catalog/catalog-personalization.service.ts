import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
	getCatalogMatchRules,
	getTechStackChoices,
	resolveMatchTagsFromOptionIds,
	validateTechnologyIds,
} from './catalog-data';
import { getCatalogPackById } from './catalog-packs';

type ProductRow = {
	id: number;
	sku: string | null;
	unitPrice: Prisma.Decimal | null;
	languages: Prisma.JsonValue;
};

export type CatalogAssignmentResult = {
	productIds: number[];
	skus: string[];
	matchScores: Record<number, number>;
};

@Injectable()
export class CatalogPersonalizationService {
	constructor(private readonly prisma: PrismaService) {}

	validateSelection(technologyIds: string[]): void {
		const choices = getTechStackChoices();
		const unique = [...new Set(technologyIds)];
		if (unique.length < choices.minTotalSelect) {
			throw new BadRequestException(
				`Sélectionnez au moins ${choices.minTotalSelect} technologies`,
			);
		}
		if (unique.length > choices.maxTotalSelect) {
			throw new BadRequestException(
				`Maximum ${choices.maxTotalSelect} technologies`,
			);
		}
		const { valid, invalid } = validateTechnologyIds(unique);
		if (!valid) {
			throw new BadRequestException(`Technologies inconnues : ${invalid.join(', ')}`);
		}
	}

	/** Calcule les produits recommandés à partir des ids d'options tech-stack. */
	async computeCatalog(technologyIds: string[]): Promise<CatalogAssignmentResult> {
		this.validateSelection(technologyIds);
		const rules = getCatalogMatchRules();
		const matchTags = resolveMatchTagsFromOptionIds(technologyIds);
		const selectedSet = new Set(technologyIds);

		const products = await this.prisma.product.findMany({
			where: { sku: { not: null }, organizationId: null },
			select: { id: true, sku: true, unitPrice: true, languages: true },
		});

		return this.rankProducts(products, matchTags, selectedSet, rules);
	}

	private rankProducts(
		products: ProductRow[],
		matchTags: Set<string>,
		selectedOptions: Set<string>,
		rules: ReturnType<typeof getCatalogMatchRules>,
	): CatalogAssignmentResult {
		const scores = new Map<number, number>();
		const skuById = new Map<number, string>();

		for (const p of products) {
			if (!p.sku) continue;
			skuById.set(p.id, p.sku);
			let score = 0;

			const langs = this.parseLanguages(p.languages);
			for (const lang of langs) {
				const norm = lang.toLowerCase();
				if (matchTags.has(norm)) {
					score += rules.languageOverlapWeight;
				}
				for (const tag of matchTags) {
					if (norm.includes(tag) || tag.includes(norm)) {
						score += 1;
					}
				}
			}

			for (const rule of rules.rules) {
				if (rule.whenAnyOption.some((opt) => selectedOptions.has(opt))) {
					if (rule.skus.includes(p.sku)) {
						score += rule.weight + rules.ruleMatchBonus;
					}
				}
			}

			const price = p.unitPrice ? Number(p.unitPrice) : 9999;
			if (price <= rules.budgetMaxUnitPrice) {
				score += rules.budgetFriendlyBonus;
			}
			if (rules.starterProfileSkus.includes(p.sku)) {
				score += 2;
			}

			if (scores.has(p.id)) {
				score = Math.max(scores.get(p.id)!, score);
			}
			scores.set(p.id, score);
		}

		for (const sku of rules.alwaysIncludeSkus) {
			const found = products.find((p) => p.sku === sku);
			if (found) scores.set(found.id, (scores.get(found.id) ?? 0) + 100);
		}

		const sorted = [...scores.entries()]
			.filter(([, s]) => s > 0)
			.sort((a, b) => b[1] - a[1])
			.slice(0, rules.maxCatalogItems);

		if (sorted.length === 0) {
			const fallback = products
				.filter((p) => p.sku && rules.starterProfileSkus.includes(p.sku))
				.slice(0, rules.maxCatalogItems);
			for (const p of fallback) {
				sorted.push([p.id, 1]);
			}
		}

		const matchScores: Record<number, number> = {};
		const productIds: number[] = [];
		const skus: string[] = [];
		for (const [id, sc] of sorted) {
			productIds.push(id);
			matchScores[id] = sc;
			const sku = skuById.get(id);
			if (sku) skus.push(sku);
		}

		return { productIds, skus, matchScores };
	}

	private parseLanguages(value: Prisma.JsonValue): string[] {
		if (!value || !Array.isArray(value)) return [];
		return value.filter((x): x is string => typeof x === 'string');
	}

	/**
	 * Installe le catalogue du compte : clone les modèles globaux, prix modifiables par org.
	 */
	async provisionOrganizationFromStack(
		organizationId: number,
		technologyIds: string[],
		source: 'onboarding' | 'manual' = 'onboarding',
	): Promise<CatalogAssignmentResult & { clonedCount: number }> {
		this.validateSelection(technologyIds);
		const computed = await this.computeCatalog(technologyIds);

		const templates = await this.prisma.product.findMany({
			where: { id: { in: computed.productIds }, organizationId: null },
		});

		await this.prisma.organizationCatalogItem.deleteMany({ where: { organizationId } });
		await this.prisma.product.deleteMany({ where: { organizationId } });

		const clonedIds: number[] = [];
		const clonedScores: Record<number, number> = {};

		for (let index = 0; index < templates.length; index++) {
			const t = templates[index]!;
			const clone = await this.prisma.product.create({
				data: {
					organizationId,
					templateProductId: t.id,
					name: t.name,
					sku: t.sku,
					kind: t.kind,
					unitPrice: t.unitPrice,
					defaultTaxRateId: t.defaultTaxRateId,
					purpose: t.purpose,
					category: t.category,
					languages: t.languages ?? [],
					details: t.details ?? [],
					estimatedHours: t.estimatedHours,
					description: t.description,
					visualType: t.visualType,
					iconName: t.iconName,
					imageData: t.imageData,
				},
			});
			clonedIds.push(clone.id);
			clonedScores[clone.id] = computed.matchScores[t.id] ?? 0;
			await this.prisma.organizationCatalogItem.create({
				data: {
					organizationId,
					productId: clone.id,
					matchScore: clonedScores[clone.id] ?? 0,
					source,
					sortOrder: index,
				},
			});
		}

		await this.prisma.organization.update({
			where: { id: organizationId },
			data: {
				preferredTechnologies: technologyIds as unknown as Prisma.JsonArray,
				onboardingCompletedAt: new Date(),
			},
		});

		return {
			productIds: clonedIds,
			skus: templates.map((t) => t.sku).filter(Boolean) as string[],
			matchScores: clonedScores,
			clonedCount: clonedIds.length,
		};
	}

	async assignOrganizationCatalog(
		organizationId: number,
		technologyIds: string[],
		source: 'onboarding' | 'manual' = 'manual',
	): Promise<CatalogAssignmentResult> {
		return this.provisionOrganizationFromStack(organizationId, technologyIds, source);
	}

	async assignClientCatalog(
		clientId: string,
		technologyIds: string[],
		source: 'client_create' | 'manual' | 'algorithm' = 'algorithm',
	): Promise<CatalogAssignmentResult> {
		const computed = await this.computeCatalog(technologyIds);

		await this.prisma.$transaction([
			this.prisma.clientCatalogItem.deleteMany({ where: { clientId } }),
			this.prisma.client.update({
				where: { id: clientId },
				data: {
					preferredTechnologies: technologyIds as unknown as Prisma.JsonArray,
				},
			}),
			...computed.productIds.map((productId, index) =>
				this.prisma.clientCatalogItem.create({
					data: {
						clientId,
						productId,
						matchScore: computed.matchScores[productId] ?? 0,
						source,
						sortOrder: index,
					},
				}),
			),
		]);

		return computed;
	}

	async getOrganizationCatalogProductIds(organizationId: number): Promise<number[]> {
		const items = await this.prisma.organizationCatalogItem.findMany({
			where: { organizationId },
			orderBy: { sortOrder: 'asc' },
			select: { productId: true },
		});
		return items.map((i) => i.productId);
	}

	async getClientCatalogProductIds(clientId: string): Promise<number[]> {
		const items = await this.prisma.clientCatalogItem.findMany({
			where: { clientId },
			orderBy: { sortOrder: 'asc' },
			select: { productId: true },
		});
		return items.map((i) => i.productId);
	}

	/**
	 * Ajoute les prestations d'un pack métier au catalogue org (sans supprimer l'existant).
	 */
	async installCatalogPack(
		organizationId: number,
		packId: string,
	): Promise<{
		packId: string;
		clonedCount: number;
		skippedCount: number;
		skus: string[];
		missingSkus: string[];
	}> {
		const pack = getCatalogPackById(packId);
		if (!pack) {
			throw new BadRequestException(`Pack catalogue inconnu : ${packId}`);
		}

		const existing = await this.prisma.product.findMany({
			where: { organizationId },
			select: { sku: true },
		});
		const existingSkus = new Set(existing.map((p) => p.sku).filter((s): s is string => !!s));

		const templates = await this.prisma.product.findMany({
			where: { organizationId: null, sku: { in: pack.skus } },
		});

		const agg = await this.prisma.organizationCatalogItem.aggregate({
			where: { organizationId },
			_max: { sortOrder: true },
		});
		let sortOrder = (agg._max.sortOrder ?? -1) + 1;

		const installedSkus: string[] = [];
		let clonedCount = 0;
		let skippedCount = 0;

		for (const t of templates) {
			if (t.sku && existingSkus.has(t.sku)) {
				skippedCount++;
				continue;
			}
			const clone = await this.prisma.product.create({
				data: {
					organizationId,
					templateProductId: t.id,
					name: t.name,
					sku: t.sku,
					kind: t.kind,
					unitPrice: t.unitPrice,
					defaultTaxRateId: t.defaultTaxRateId,
					purpose: t.purpose,
					category: t.category,
					languages: t.languages ?? [],
					details: t.details ?? [],
					estimatedHours: t.estimatedHours,
					description: t.description,
					visualType: t.visualType,
					iconName: t.iconName,
					imageData: t.imageData,
				},
			});
			if (t.sku) {
				existingSkus.add(t.sku);
				installedSkus.push(t.sku);
			}
			await this.prisma.organizationCatalogItem.create({
				data: {
					organizationId,
					productId: clone.id,
					matchScore: 0,
					source: `pack:${packId}`,
					sortOrder: sortOrder++,
				},
			});
			clonedCount++;
		}

		const missingSkus = pack.skus.filter((sku) => !templates.some((t) => t.sku === sku));
		if (clonedCount === 0 && skippedCount === 0 && missingSkus.length === pack.skus.length) {
			throw new BadRequestException(
				`Aucune prestation du pack trouvée. Exécutez le seed prestations (${pack.skus.join(', ')}).`,
			);
		}

		return { packId, clonedCount, skippedCount, skus: installedSkus, missingSkus };
	}
}
