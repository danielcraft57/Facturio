import { CatalogPersonalizationService } from './catalog-personalization.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('CatalogPersonalizationService', () => {
	const mockProducts = [
		{
			id: 1,
			sku: 'STACK-WEB-STATIC',
			unitPrice: 490,
			languages: ['HTML', 'CSS', 'JavaScript'],
			techStack: { languages: ['HTML', 'CSS', 'JavaScript'] },
		},
		{
			id: 2,
			sku: 'ADDON-SEO-BASIQUE',
			unitPrice: 290,
			languages: ['HTML', 'CSS'],
			techStack: { languages: ['HTML', 'CSS'] },
		},
		{
			id: 3,
			sku: 'STACK-MVP-REACT-NEST',
			unitPrice: 750,
			languages: ['TypeScript', 'React', 'NestJS', 'Node.js'],
			techStack: {
				languages: ['TypeScript'],
				frontend: ['React'],
				backend: ['NestJS', 'Node.js'],
			},
		},
		{
			id: 4,
			sku: 'STACK-WP-VITRINE',
			unitPrice: 450,
			languages: ['PHP', 'WordPress'],
			techStack: { languages: ['PHP'], cms: ['WordPress'] },
		},
		{
			id: 5,
			sku: 'STACK-PRESTASHOP-BOUTIQUE',
			unitPrice: 590,
			languages: ['PHP', 'PrestaShop'],
			techStack: { languages: ['PHP'], cms: ['PrestaShop'] },
		},
		{
			id: 6,
			sku: 'OFFRE-VITRINE-CLAIR',
			unitPrice: 420,
			languages: ['HTML', 'CSS', 'JavaScript'],
			techStack: { languages: ['HTML', 'CSS', 'JavaScript'] },
		},
	];

	function createService() {
		const prisma = {
			product: { findMany: jest.fn().mockResolvedValue(mockProducts) },
		} as unknown as PrismaService;
		const deliverablesCatalog = {} as never;
		return new CatalogPersonalizationService(prisma, deliverablesCatalog);
	}

	it('inclut toujours les SKU alwaysInclude et matche React/TypeScript', async () => {
		const service = createService();
		const result = await service.computeCatalog(['react', 'typescript', 'html-css']);

		expect(result.skus).toContain('ADDON-SEO-BASIQUE');
		expect(result.skus).toContain('STACK-WEB-STATIC');
		expect(result.productIds.length).toBeGreaterThan(0);
		expect(result.productIds.length).toBeLessThanOrEqual(12);
	});

	it('rejette une sélection trop courte', async () => {
		const service = createService();
		await expect(service.computeCatalog(['react'])).rejects.toThrow();
	});

	it('ne propose pas WordPress/PrestaShop avec PHP seul', async () => {
		const service = createService();
		const result = await service.computeCatalog(['php', 'html-css', 'javascript']);

		expect(result.skus).not.toContain('STACK-WP-VITRINE');
		expect(result.skus).not.toContain('STACK-PRESTASHOP-BOUTIQUE');
	});

	it('preview : CMS non coché → suggested false', async () => {
		const service = createService();
		const preview = await service.buildCatalogPreview(['php', 'html-css', 'javascript']);

		const wp = preview.products.find((p) => p.sku === 'STACK-WP-VITRINE');
		const offre = preview.products.find((p) => p.sku === 'OFFRE-VITRINE-CLAIR');
		expect(wp).toBeUndefined();
		expect(offre?.suggested).toBe(true);
	});
});
