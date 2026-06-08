import { PrismaClient } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';

type MatchRulesFile = {
	alwaysIncludeSkus: string[];
	starterProfileSkus: string[];
	rules: { skus: string[] }[];
};

type CatalogPacksFile = {
	packs: { id: string; skus: string[] }[];
};

/**
 * Vérifie que les SKU des règles et packs existent en base (après seedProducts).
 */
export async function seedCatalogRulesValidation(prisma: PrismaClient): Promise<void> {
	const dataDir = path.join(__dirname, '..', '..', 'data', 'catalog');
	const rules = JSON.parse(fs.readFileSync(path.join(dataDir, 'catalog-match-rules.json'), 'utf-8')) as MatchRulesFile;
	const packs = JSON.parse(fs.readFileSync(path.join(dataDir, 'catalog-packs.json'), 'utf-8')) as CatalogPacksFile;

	const allSkus = new Set<string>([
		...rules.alwaysIncludeSkus,
		...rules.starterProfileSkus,
		...rules.rules.flatMap((r) => r.skus),
		...packs.packs.flatMap((p) => p.skus),
	]);

	const products = await prisma.product.findMany({
		where: { sku: { in: [...allSkus] } },
		select: { sku: true },
	});
	const found = new Set(products.map((p) => p.sku).filter(Boolean) as string[]);
	const missing = [...allSkus].filter((sku) => !found.has(sku));

	if (missing.length > 0) {
		console.warn('[catalog-rules.seed] SKU manquants dans Product:', missing.join(', '));
	} else {
		console.log(`[catalog-rules.seed] ${allSkus.size} SKU (règles + packs) OK`);
	}
}
