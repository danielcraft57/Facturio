import { DEV_PRODUCTS, DEV_PRODUCT_ALIASES } from '../../prisma/seeds/dev-products.catalog';
import { flattenTechAssembly } from './tech-assembly.utils';
import { getCatalogPacks } from './catalog-packs';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('dev-products catalog v2', () => {
	const seedSkus = new Set(DEV_PRODUCTS.map((p) => p.sku));

	it('contient entre 28 et 40 livrables stack', () => {
		expect(DEV_PRODUCTS.length).toBeGreaterThanOrEqual(28);
		expect(DEV_PRODUCTS.length).toBeLessThanOrEqual(40);
	});

	it('chaque produit a un assemblage techno non vide', () => {
		const empty = DEV_PRODUCTS.filter((p) => flattenTechAssembly(p.assembly).length === 0).map(
			(p) => p.sku,
		);
		expect(empty).toEqual([]);
	});

	it('alias démo pointent vers des SKU du catalogue', () => {
		for (const sku of Object.values(DEV_PRODUCT_ALIASES)) {
			expect(seedSkus.has(sku)).toBe(true);
		}
	});

	it('règles et packs référencent uniquement des SKU seed', () => {
		const dataDir = path.join(__dirname, '..', '..', 'data', 'catalog');
		const rules = JSON.parse(
			fs.readFileSync(path.join(dataDir, 'catalog-match-rules.json'), 'utf-8'),
		) as {
			alwaysIncludeSkus: string[];
			starterProfileSkus: string[];
			rules: { skus: string[] }[];
		};
		const packs = getCatalogPacks();
		const referenced = new Set<string>([
			...rules.alwaysIncludeSkus,
			...rules.starterProfileSkus,
			...rules.rules.flatMap((r) => r.skus),
			...packs.packs.flatMap((p) => p.skus),
		]);
		const missing = [...referenced].filter((sku) => !seedSkus.has(sku));
		expect(missing).toEqual([]);
	});

	it('MVP React/Nest décrit une stack full-stack explicite', () => {
		const mvp = DEV_PRODUCTS.find((p) => p.sku === 'STACK-MVP-REACT-NEST');
		expect(mvp?.assembly.frontend).toContain('React');
		expect(mvp?.assembly.backend).toContain('NestJS');
		expect(mvp?.assembly.databases).toContain('PostgreSQL');
	});
});
