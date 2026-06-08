import { Inject, Injectable, BadRequestException, forwardRef } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DeliverablesCatalogService } from '../products/deliverables-catalog.service';
import {
	getCatalogMatchRules,
	getTechStackChoices,
	resolveMatchTagsFromOptionIds,
	validateTechnologyIds,
} from './catalog-data';
import { getCatalogPackById } from './catalog-packs';
import { labelCatalogMatchReason } from './catalog-match-labels';
import { isProductEligibleForStack } from './catalog-stack-eligibility';
import { flattenTechAssembly } from './tech-assembly.utils';
import type { TechStackAssembly } from './tech-assembly.types';

type ProductRow = {
	id: number;
	sku: string | null;
	unitPrice: Prisma.Decimal | null;
	languages: Prisma.JsonValue;
	techStack: Prisma.JsonValue;
};

export type CatalogAssignmentResult = {
	productIds: number[];
	skus: string[];
	matchScores: Record<number, number>;
	deliverablesIndexed?: number;
};

export type ProvisionCatalogOptions = {
	devProfile?: string;
	templateProductIds?: number[];
};

export type CatalogPreviewProduct = {
	id: number;
	name: string;
	sku: string | null;
	unitPrice: Prisma.Decimal | null;
	description: string | null;
	matchScore: number;
	matchReasons: string[];
	techLabels: string[];
	suggested: boolean;
};

type ProductScoreMeta = {
	score: number;
	reasons: string[];
	ruleMatched: boolean;
};

@Injectable()
export class CatalogPersonalizationService {
	constructor(
		private readonly prisma: PrismaService,
		@Inject(forwardRef(() => DeliverablesCatalogService))
		private readonly deliverablesCatalog: DeliverablesCatalogService,
	) {}

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
			select: { id: true, sku: true, unitPrice: true, languages: true, techStack: true },
		});

		return this.rankProducts(products, matchTags, selectedSet, rules, rules.maxCatalogItems).result;
	}

	/** Preview détaillé : scores, raisons et sélection suggérée (jusqu'à 30 lignes). */
	async buildCatalogPreview(technologyIds: string[]): Promise<{
		technologyIds: string[];
		products: CatalogPreviewProduct[];
		total: number;
	}> {
		this.validateSelection(technologyIds);
		const rules = getCatalogMatchRules();
		const matchTags = resolveMatchTagsFromOptionIds(technologyIds);
		const selectedSet = new Set(technologyIds);

		const rows = await this.prisma.product.findMany({
			where: { sku: { not: null }, organizationId: null },
			select: {
				id: true,
				name: true,
				sku: true,
				unitPrice: true,
				description: true,
				languages: true,
				techStack: true,
			},
		});

		const ranked = this.rankProducts(rows, matchTags, selectedSet, rules, 30);
		const byId = new Map(rows.map((p) => [p.id, p]));

		const products: CatalogPreviewProduct[] = ranked.result.productIds
			.map((id) => {
				const p = byId.get(id);
				if (!p) return null;
				const meta = ranked.matchMeta[id];
				return {
					id: p.id,
					name: p.name,
					sku: p.sku,
					unitPrice: p.unitPrice,
					description: p.description,
					matchScore: ranked.result.matchScores[id] ?? 0,
					matchReasons: meta?.reasons ?? [],
					techLabels: this.parseProductTechLabels(p).slice(0, 8),
					suggested: this.isSuggestedPreviewProduct(p.sku, meta, rules),
				};
			})
			.filter((p): p is CatalogPreviewProduct => p != null);

		return { technologyIds, products, total: products.length };
	}

	private isSuggestedPreviewProduct(
		sku: string | null,
		meta: ProductScoreMeta | undefined,
		rules: ReturnType<typeof getCatalogMatchRules>,
	): boolean {
		if (!sku || !meta) return false;
		if (meta.ruleMatched) return true;
		if (rules.alwaysIncludeSkus.includes(sku) && !meta.ruleMatched) return false;
		return meta.score >= 14;
	}

	private scoreProduct(
		product: ProductRow,
		matchTags: Set<string>,
		selectedOptions: Set<string>,
		rules: ReturnType<typeof getCatalogMatchRules>,
	): ProductScoreMeta {
		const assembly =
			product.techStack && typeof product.techStack === 'object' && !Array.isArray(product.techStack)
				? (product.techStack as TechStackAssembly)
				: null;
		if (!isProductEligibleForStack(assembly, selectedOptions)) {
			return { score: 0, reasons: [], ruleMatched: false };
		}

		let score = 0;
		const reasons: string[] = [];
		let ruleMatched = false;

		const langs = this.parseProductTechLabels(product);
		const overlappingTags: string[] = [];
		for (const lang of langs) {
			const norm = lang.toLowerCase();
			if (matchTags.has(norm)) {
				score += rules.languageOverlapWeight;
				overlappingTags.push(lang);
			}
		}
		if (overlappingTags.length) {
			reasons.push(`Technos communes : ${[...new Set(overlappingTags)].slice(0, 4).join(', ')}`);
		}

		for (const rule of rules.rules) {
			if (rule.whenAnyOption.some((opt) => selectedOptions.has(opt))) {
				if (product.sku && rule.skus.includes(product.sku)) {
					score += rule.weight + rules.ruleMatchBonus;
					reasons.push(labelCatalogMatchReason(rule.id));
					ruleMatched = true;
				}
			}
		}

		const price = product.unitPrice ? Number(product.unitPrice) : 9999;
		if (price <= rules.budgetMaxUnitPrice) {
			score += rules.budgetFriendlyBonus;
		}
		if (product.sku && rules.starterProfileSkus.includes(product.sku)) {
			score += 2;
		}
		if (product.sku && rules.alwaysIncludeSkus.includes(product.sku)) {
			score += 6;
			if (!ruleMatched) {
				reasons.push('Add-on courant (optionnel)');
			}
		}

		if (reasons.length === 0 && score > 0) {
			reasons.push('Pertinence faible — à valider');
		}

		return { score, reasons, ruleMatched };
	}

	private rankProducts(
		products: ProductRow[],
		matchTags: Set<string>,
		selectedOptions: Set<string>,
		rules: ReturnType<typeof getCatalogMatchRules>,
		maxItems: number,
	): { result: CatalogAssignmentResult; matchMeta: Record<number, ProductScoreMeta> } {
		const matchMeta: Record<number, ProductScoreMeta> = {};
		const skuById = new Map<number, string>();

		for (const p of products) {
			if (!p.sku) continue;
			skuById.set(p.id, p.sku);
			matchMeta[p.id] = this.scoreProduct(p, matchTags, selectedOptions, rules);
		}

		const sorted = Object.entries(matchMeta)
			.map(([id, meta]) => [Number(id), meta.score] as const)
			.filter(([, s]) => s > 0)
			.sort((a, b) => b[1] - a[1])
			.slice(0, maxItems);

		if (sorted.length === 0) {
			const fallback = products
				.filter((p) => p.sku && rules.starterProfileSkus.includes(p.sku))
				.slice(0, maxItems);
			for (const p of fallback) {
				sorted.push([p.id, 1]);
				matchMeta[p.id] = {
					score: 1,
					reasons: ['Catalogue de démarrage'],
					ruleMatched: false,
				};
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

		return {
			result: { productIds, skus, matchScores },
			matchMeta,
		};
	}

	private parseLanguages(value: Prisma.JsonValue): string[] {
		if (!value || !Array.isArray(value)) return [];
		return value.filter((x): x is string => typeof x === 'string');
	}

	private parseProductTechLabels(product: Pick<ProductRow, 'languages' | 'techStack'>): string[] {
		if (product.techStack && typeof product.techStack === 'object' && !Array.isArray(product.techStack)) {
			return flattenTechAssembly(product.techStack as TechStackAssembly);
		}
		return this.parseLanguages(product.languages);
	}

	/**
	 * Installe le catalogue du compte : clone les modèles globaux, prix modifiables par org.
	 */
	async provisionOrganizationFromStack(
		organizationId: number,
		technologyIds: string[],
		source: 'onboarding' | 'manual' = 'onboarding',
		options?: ProvisionCatalogOptions,
	): Promise<CatalogAssignmentResult & { clonedCount: number; deliverablesIndexed: number }> {
		this.validateSelection(technologyIds);
		const rules = getCatalogMatchRules();
		const matchTags = resolveMatchTagsFromOptionIds(technologyIds);
		const selectedSet = new Set(technologyIds);

		const allProducts = await this.prisma.product.findMany({
			where: { sku: { not: null }, organizationId: null },
			select: { id: true, sku: true, unitPrice: true, languages: true, techStack: true },
		});

		const ranked = this.rankProducts(allProducts, matchTags, selectedSet, rules, 30);
		const computed = ranked.result;

		let templateIds = computed.productIds;
		if (options?.templateProductIds?.length) {
			const allowed = new Set(computed.productIds);
			templateIds = options.templateProductIds.filter((id) => allowed.has(id));
			if (templateIds.length === 0) {
				throw new BadRequestException('Sélectionnez au moins une prestation dans la liste.');
			}
		}

		const orderIndex = new Map(templateIds.map((id, index) => [id, index]));
		const templates = (
			await this.prisma.product.findMany({
				where: { id: { in: templateIds }, organizationId: null },
			})
		).sort((a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0));

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
					techStack: t.techStack ?? undefined,
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

		const deliverablesIndexed =
			await this.deliverablesCatalog.syncAllFromOrganizationProducts(organizationId);

		await this.prisma.organization.update({
			where: { id: organizationId },
			data: {
				preferredTechnologies: technologyIds as unknown as Prisma.JsonArray,
				onboardingCompletedAt: new Date(),
				...(options?.devProfile ? { devProfile: options.devProfile } : {}),
			},
		});

		return {
			productIds: clonedIds,
			skus: templates.map((t) => t.sku).filter(Boolean) as string[],
			matchScores: clonedScores,
			clonedCount: clonedIds.length,
			deliverablesIndexed,
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
					techStack: t.techStack ?? undefined,
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
