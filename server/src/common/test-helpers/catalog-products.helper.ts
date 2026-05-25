import { PrismaClient, ProductKind } from '@prisma/client';

/** Produits minimaux pour que l'algorithme de catalogue ait des SKU à matcher en e2e. */
const CATALOG_E2E_PRODUCTS: Array<{
	sku: string;
	name: string;
	unitPrice: number;
	languages: string[];
	kind?: ProductKind;
}> = [
	{ sku: 'SEO-BASIQUE', name: 'SEO Basique', unitPrice: 120, languages: [] },
	{ sku: 'PAGE-SUPP', name: 'Page supplémentaire', unitPrice: 80, languages: ['HTML', 'CSS'] },
	{ sku: 'DEPANNAGE-2H', name: 'Dépannage 2h', unitPrice: 90, languages: [] },
	{ sku: 'SITE-VITRINE', name: 'Site Vitrine', unitPrice: 490, languages: ['HTML', 'CSS', 'JavaScript'] },
	{ sku: 'AUTO-METIER', name: 'App métier', unitPrice: 750, languages: ['TypeScript', 'React', 'NestJS', 'Node.js'] },
	{ sku: 'INTEG-API', name: 'Intégration API', unitPrice: 320, languages: ['TypeScript', 'Node.js'] },
	{ sku: 'REFONTE-LEGERE', name: 'Refonte légère', unitPrice: 280, languages: ['HTML', 'CSS', 'JavaScript'] },
	{ sku: 'IA-FAQ-SITE', name: 'FAQ IA', unitPrice: 199, languages: ['ChatGPT API', 'JavaScript'] },
];

export async function seedCatalogProductsForE2e(prisma: PrismaClient): Promise<void> {
	for (const p of CATALOG_E2E_PRODUCTS) {
		const existing = await prisma.product.findFirst({
			where: { sku: p.sku, organizationId: null },
		});
		const payload = {
			name: p.name,
			sku: p.sku,
			organizationId: null,
			unitPrice: p.unitPrice,
			languages: p.languages,
			kind: p.kind ?? 'SERVICE',
			category: 'DEV',
		};
		if (!existing) {
			await prisma.product.create({ data: payload });
		} else {
			await prisma.product.update({
				where: { id: existing.id },
				data: { name: p.name, unitPrice: p.unitPrice, languages: p.languages },
			});
		}
	}
}

const TECH_TAGS = [
	'JavaScript',
	'TypeScript',
	'React',
	'NestJS',
	'Node.js',
	'Python',
	'HTML',
	'CSS',
	'ChatGPT API',
];

const PRODUCT_KINDS: ProductKind[] = ['SERVICE', 'APP', 'SAAS', 'GOOD'];

function pickRandom<T>(arr: T[], min: number, max: number): T[] {
	const count = min + Math.floor(Math.random() * (max - min + 1));
	const copy = [...arr];
	const out: T[] = [];
	for (let i = 0; i < count && copy.length > 0; i++) {
		const idx = Math.floor(Math.random() * copy.length);
		out.push(copy.splice(idx, 1)[0]!);
	}
	return out;
}

export type RandomProductPayload = {
	name: string;
	sku: string;
	kind: ProductKind;
	unitPrice: number;
	languages: string[];
	category: string;
	description: string;
};

/** Génère un payload produit aléatoire pour POST /api/products. */
export function buildRandomProductPayload(index: number): RandomProductPayload {
	const suffix = `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
	return {
		name: `Prestation e2e ${suffix}`,
		sku: `E2E-${suffix.replace(/[^a-z0-9]/gi, '').slice(-10).toUpperCase()}`,
		kind: PRODUCT_KINDS[Math.floor(Math.random() * PRODUCT_KINDS.length)]!,
		unitPrice: 49 + Math.floor(Math.random() * 280),
		languages: pickRandom(TECH_TAGS, 1, 4),
		category: 'DEV',
		description: 'Créé automatiquement après inscription (test e2e)',
	};
}
