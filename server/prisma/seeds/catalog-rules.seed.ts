import { PrismaClient } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';

type MatchRulesFile = {
	alwaysIncludeSkus: string[];
	starterProfileSkus: string[];
	rules: { skus: string[] }[];
};

/**
 * Vérifie que les SKU des règles de matching existent en base (après seedProducts).
 */
export async function seedCatalogRulesValidation(prisma: PrismaClient): Promise<void> {
	const rulesPath = path.join(__dirname, '..', '..', 'data', 'catalog', 'catalog-match-rules.json');
	const raw = fs.readFileSync(rulesPath, 'utf-8');
	const rules = JSON.parse(raw) as MatchRulesFile;

	const allSkus = new Set<string>([
		...rules.alwaysIncludeSkus,
		...rules.starterProfileSkus,
		...rules.rules.flatMap((r) => r.skus),
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
		console.log(`[catalog-rules.seed] ${allSkus.size} SKU de règles OK`);
	}
}
