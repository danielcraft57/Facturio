import { DeliverablesCatalogService } from './deliverables-catalog.service';

describe('DeliverablesCatalogService', () => {
	const prisma = {
		product: {
			findMany: jest.fn(),
		},
		deliverableCatalogItem: {
			findMany: jest.fn(),
			upsert: jest.fn(),
		},
	};

	let service: DeliverablesCatalogService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new DeliverablesCatalogService(prisma as never);
	});

	it('recherche les livrables de l’organisation', async () => {
		prisma.deliverableCatalogItem.findMany.mockResolvedValue([
			{
				id: 1,
				label: 'Intégration WordPress',
				defaultAmount: 1200,
				defaultHours: 16,
			},
		]);

		const items = await service.search(42, 'word');

		expect(prisma.deliverableCatalogItem.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ organizationId: 42 }),
				take: 25,
			}),
		);
		expect(items).toEqual([
			{
				id: 1,
				label: 'Intégration WordPress',
				defaultAmount: 1200,
				defaultHours: 16,
			},
		]);
	});

	it('upsert les livrables avec montant et heures', async () => {
		await service.syncFromDeliverables(7, [
			{ label: '  API REST  ', amount: 800, hours: 10 },
			{ label: '', amount: 100 },
		]);

		expect(prisma.deliverableCatalogItem.upsert).toHaveBeenCalledTimes(1);
		expect(prisma.deliverableCatalogItem.upsert).toHaveBeenCalledWith({
			where: { organizationId_labelKey: { organizationId: 7, labelKey: 'api rest' } },
			create: {
				organizationId: 7,
				label: 'API REST',
				labelKey: 'api rest',
				defaultAmount: 800,
				defaultHours: 10,
			},
			update: {
				label: 'API REST',
				defaultAmount: 800,
				defaultHours: 10,
			},
		});
	});

	it('indexe les livrables de tous les produits org après install', async () => {
		prisma.product.findMany.mockResolvedValue([
			{ details: ['Thème enfant', 'Back-office'] },
			{ details: [] },
		]);

		const count = await service.syncAllFromOrganizationProducts(9);

		expect(prisma.product.findMany).toHaveBeenCalledWith({
			where: { organizationId: 9 },
			select: { details: true },
		});
		expect(prisma.deliverableCatalogItem.upsert).toHaveBeenCalledTimes(2);
		expect(count).toBe(2);
	});
});
