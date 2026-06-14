import { BadRequestException } from '@nestjs/common';
import { ReceivablesService } from './receivables.service';

describe('ReceivablesService', () => {
	const prisma = {
		invoice: { findMany: jest.fn() },
		invoiceInstallment: { findMany: jest.fn().mockResolvedValue([]) },
		emailEvent: { findMany: jest.fn().mockResolvedValue([]) },
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
		expect(res.summary.installmentCount).toBe(0);
		expect(res.installmentReceivables).toEqual([]);
	});

	it('expose les créances par échéance de plan actif', async () => {
		prisma.invoice.findMany.mockResolvedValue([
			{
				id: 'inv-plan',
				number: 'FAC-PLAN',
				clientId: 'c1',
				date: new Date('2026-01-01'),
				dueDate: new Date('2026-06-01'),
				total: 300,
				balance: 300,
				status: 'SENT',
				tags: null,
				sourceQuoteId: null,
				client: { id: 'c1', name: 'Client', email: 'c@test.com' },
			},
		]);
		prisma.invoiceInstallment.findMany.mockResolvedValue([
			{
				id: 10,
				sequence: 1,
				dueDate: new Date('2026-02-01'),
				amount: 100,
				status: 'PENDING',
				invoice: {
					id: 'inv-plan',
					number: 'FAC-PLAN',
					clientId: 'c1',
					balance: 300,
					client: { name: 'Client' },
				},
			},
		]);

		const res = await service.getReceivables(1);
		expect(res.summary.installmentCount).toBe(1);
		expect(res.summary.installmentOutstanding).toBe(100);
		expect(res.installmentReceivables[0]).toMatchObject({
			id: 10,
			sequence: 1,
			invoiceNumber: 'FAC-PLAN',
			amount: 100,
			autoTracked: true,
		});
	});

	it('inclut le solde après acompte en brouillon', async () => {
		prisma.invoice.findMany.mockResolvedValue([
			{
				id: 'sol1',
				number: 'SOL-2026-001',
				clientId: 'c1',
				sourceQuoteId: 'q1',
				tags: JSON.stringify(['SOLDE_APRES_ACOMPTE', 'PENDING_EMIT']),
				date: new Date('2026-03-01'),
				dueDate: new Date('2026-04-01'),
				total: 900,
				balance: 900,
				status: 'DRAFT',
				client: { id: 'c1', name: 'Client', email: 'c@test.com' },
			},
		]);

		const res = await service.getReceivables(1);
		expect(res.summary.invoiceCount).toBe(1);
		expect(res.invoices[0].documentKind).toBe('remainder');
		expect(res.summary.byKind.remainder).toBe(900);
	});

	it('expose documentKind standard par défaut', async () => {
		prisma.invoice.findMany.mockResolvedValue([
			{
				id: 'inv1',
				number: 'FAC-1',
				clientId: 'c1',
				sourceQuoteId: null,
				tags: null,
				archivedAt: null,
				date: new Date('2026-01-10'),
				dueDate: new Date('2026-02-01'),
				total: 100,
				balance: 100,
				status: 'SENT',
				client: { id: 'c1', name: 'Acme', email: 'a@test.com' },
			},
		]);

		const res = await service.getReceivables(1);
		expect(res.invoices[0].documentKind).toBe('standard');
		expect(res.summary.byKind.standard).toBe(100);
	});
});
