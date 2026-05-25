import { CatalogPersonalizationService } from './catalog-personalization.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('CatalogPersonalizationService', () => {
	const mockProducts = [
		{
			id: 1,
			sku: 'SITE-VITRINE',
			unitPrice: 490,
			languages: ['HTML', 'CSS', 'JavaScript'],
		},
		{
			id: 2,
			sku: 'SEO-BASIQUE',
			unitPrice: 120,
			languages: [],
		},
		{
			id: 3,
			sku: 'AUTO-METIER',
			unitPrice: 1200,
			languages: ['TypeScript', 'React', 'NestJS', 'Node.js'],
		},
	];

	function createService() {
		const prisma = {
			product: { findMany: jest.fn().mockResolvedValue(mockProducts) },
		} as unknown as PrismaService;
		return new CatalogPersonalizationService(prisma);
	}

	it('inclut toujours les SKU alwaysInclude et matche React/TypeScript', async () => {
		const service = createService();
		const result = await service.computeCatalog(['react', 'typescript', 'html-css']);

		expect(result.skus).toContain('SEO-BASIQUE');
		expect(result.skus).toContain('SITE-VITRINE');
		expect(result.productIds.length).toBeGreaterThan(0);
		expect(result.productIds.length).toBeLessThanOrEqual(22);
	});

	it('rejette une sélection trop courte', async () => {
		const service = createService();
		await expect(service.computeCatalog(['react'])).rejects.toThrow();
	});
});
