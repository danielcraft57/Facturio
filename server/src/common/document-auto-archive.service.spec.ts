import { DocumentAutoArchiveService } from './document-auto-archive.service';

describe('DocumentAutoArchiveService', () => {
	const mockPrisma = {
		invoice: {
			updateMany: jest.fn().mockResolvedValue({ count: 2 }),
			count: jest.fn().mockResolvedValue(0),
		},
		quote: {
			updateMany: jest.fn().mockResolvedValue({ count: 1 }),
			count: jest.fn().mockResolvedValue(0),
		},
		payableDebt: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
		client: {
			findMany: jest.fn().mockResolvedValue([{ id: 'c1' }]),
			update: jest.fn().mockResolvedValue({}),
		},
	};

	beforeEach(() => {
		jest.clearAllMocks();
		mockPrisma.client.findMany.mockResolvedValue([{ id: 'c1' }]);
	});

	it('archive les documents terminés plus vieux que le délai', async () => {
		const service = new DocumentAutoArchiveService(
			mockPrisma as never,
			{ autoArchiveMonths: 12 } as never,
		);

		mockPrisma.invoice.updateMany = jest.fn().mockImplementation(({ where }) => {
			expect(where.status.in).toEqual(['PAID', 'CANCELLED']);
			expect(where.archivedAt).toBeNull();
			return { count: 3 };
		});

		const result = await service.archiveStaleDocuments();
		expect(result.invoices).toBe(3);
		expect(mockPrisma.invoice.updateMany).toHaveBeenCalled();
	});

	it('ne fait rien si auto-archive désactivé', async () => {
		const service = new DocumentAutoArchiveService(
			mockPrisma as never,
			{ autoArchiveMonths: 0 } as never,
		);
		const result = await service.archiveStaleDocuments();
		expect(result).toEqual({ invoices: 0, quotes: 0, payableDebts: 0, clients: 0 });
		expect(mockPrisma.invoice.updateMany).not.toHaveBeenCalled();
	});
});
