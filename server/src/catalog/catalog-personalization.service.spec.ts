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

		expect(result.skus).toContain('ADDON-SEO-BASIQUE');
		expect(result.skus).toContain('STACK-WEB-STATIC');
		expect(result.productIds.length).toBeGreaterThan(0);
		expect(result.productIds.length).toBeLessThanOrEqual(12);
	});

	it('rejette une sélection trop courte', async () => {
		const service = createService();
		await expect(service.computeCatalog(['react'])).rejects.toThrow();
	});
});
