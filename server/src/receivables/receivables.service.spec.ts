import { BadRequestException } from '@nestjs/common';
import { ReceivablesService } from './receivables.service';

describe('ReceivablesService', () => {
	const prisma = {
		invoice: { findMany: jest.fn() },
	} as any;

	const service = new ReceivablesService(prisma);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('exige une organisation', async () => {
		await expect(service.getReceivables(undefined)).rejects.toBeInstanceOf(BadRequestException);
	});

	it('agrège les factures avec solde', async () => {
		prisma.invoice.findMany.mockResolvedValue([
			{
				id: 'inv1',
				number: 'FAC-2026-001',
				clientId: 'client1',
				date: new Date('2026-01-10'),
				dueDate: new Date('2026-02-01'),
				total: 120,
				balance: 120,
				status: 'SENT',
				client: { id: 'client1', name: 'Acme', email: 'a@test.com' },
			},
			{
				id: 'inv2',
				number: 'FAC-2026-002',
				clientId: 'client1',
				date: new Date('2026-01-15'),
				dueDate: null,
				total: 50,
				balance: 0,
				status: 'PAID',
				client: { id: 'client1', name: 'Acme', email: 'a@test.com' },
			},
		]);

		const res = await service.getReceivables(1);
		expect(res.summary.totalOutstanding).toBe(120);
		expect(res.summary.invoiceCount).toBe(1);
		expect(res.summary.clientCount).toBe(1);
		expect(res.clients[0].totalBalance).toBe(120);
	});
});
