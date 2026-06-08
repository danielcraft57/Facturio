import { PrismaClient, ProductKind } from '@prisma/client';

/** Produits minimaux catalogue v2 pour e2e onboarding. */
const CATALOG_E2E_PRODUCTS: Array<{
	sku: string;
	name: string;
	unitPrice: number;
	techStack: Record<string, string[]>;
	kind?: ProductKind;
}> = [
	{
		sku: 'ADDON-SEO-BASIQUE',
		name: 'SEO Basique',
		unitPrice: 290,
		techStack: { languages: ['HTML', 'CSS'] },
	},
	{
		sku: 'ADDON-PAGE-SUPP',
		name: 'Page supplémentaire',
		unitPrice: 65,
		techStack: { languages: ['HTML', 'CSS'] },
	},
	{
		sku: 'ADDON-DEPANNAGE-2H',
		name: 'Dépannage 2h',
		unitPrice: 120,
		techStack: { languages: ['JavaScript'], cms: ['WordPress'] },
	},
	{
		sku: 'STACK-WEB-STATIC',
		name: 'Site vitrine statique',
		unitPrice: 490,
		techStack: { languages: ['HTML', 'CSS', 'JavaScript'] },
	},
	{
		sku: 'STACK-MVP-REACT-NEST',
		name: 'MVP SaaS React + NestJS',
		unitPrice: 750,
		techStack: {
			languages: ['TypeScript'],
			frontend: ['React'],
			backend: ['NestJS', 'Node.js'],
			databases: ['PostgreSQL'],
		},
	},
	{
		sku: 'STACK-FASTAPI-API',
		name: 'API FastAPI',
		unitPrice: 620,
		techStack: { languages: ['Python'], backend: ['FastAPI'], databases: ['PostgreSQL'] },
	},
	{
		sku: 'STACK-CHATBOT-WEB',
		name: 'Chatbot IA',
		unitPrice: 990,
		techStack: { languages: ['TypeScript'], ai: ['OpenAI'] },
	},
];

function flatten(stack: Record<string, string[]>): string[] {
	return Object.values(stack).flat();
}

export async function seedCatalogProductsForE2e(prisma: PrismaClient): Promise<void> {
	for (const p of CATALOG_E2E_PRODUCTS) {
		const existing = await prisma.product.findFirst({
			where: { sku: p.sku, organizationId: null },
		});
		const languages = flatten(p.techStack);
		const payload = {
			name: p.name,
			sku: p.sku,
			organizationId: null,
			unitPrice: p.unitPrice,
			languages,
			techStack: p.techStack,
			kind: p.kind ?? 'SERVICE',
			category: 'DEV',
		};
		if (!existing) {
			await prisma.product.create({ data: payload });
		} else {
			await prisma.product.update({
				where: { id: existing.id },
				data: { name: p.name, unitPrice: p.unitPrice, languages, techStack: p.techStack },
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
	'OpenAI',
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
