import { NotFoundException } from '@nestjs/common';
import { InvoiceInstallmentsService } from './invoice-installments.service';

describe('InvoiceInstallmentsService', () => {
	const prisma = {
		invoice: { findFirst: jest.fn() },
		invoiceInstallment: { findMany: jest.fn() },
	} as any;

	const accounting = {
		findPostedEntriesByReferences: jest.fn(),
	};

	const service = new InvoiceInstallmentsService(prisma, accounting as any);

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('listForInvoiceWithFinance — créances et écritures par échéance', async () => {
		const duePending = new Date('2026-04-01');
		const duePaid = new Date('2026-03-01');
		prisma.invoice.findFirst.mockResolvedValue({
			id: 'inv-1',
			number: 'FAC-2026-010',
			date: new Date('2026-02-01'),
			organizationId: 1,
		});
		prisma.invoiceInstallment.findMany.mockResolvedValue([
			{
				id: 1,
				sequence: 1,
				amount: 100,
				dueDate: duePaid,
				status: 'PAID',
				paymentId: 9,
				paidAt: new Date('2026-03-05'),
			},
			{
				id: 2,
				sequence: 2,
				amount: 200,
				dueDate: duePending,
				status: 'PENDING',
				paymentId: null,
				paidAt: null,
			},
		]);
		accounting.findPostedEntriesByReferences.mockResolvedValue(
			new Map([
				[
					'VENTE FAC-2026-010',
					{
						id: 501,
						journalCode: 'VE',
						reference: 'VENTE FAC-2026-010',
						date: '2026-02-01T00:00:00.000Z',
						memo: 'Facture FAC-2026-010',
					},
				],
				[
					'PAIEMENT FAC-2026-010#9',
					{
						id: 502,
						journalCode: 'BQ',
						reference: 'PAIEMENT FAC-2026-010#9',
						date: '2026-03-05T00:00:00.000Z',
						memo: 'Encaissement',
					},
				],
			]),
		);

		const res = await service.listForInvoiceWithFinance('inv-1', 1);

		expect(res.saleAccounting).toMatchObject({
			entryId: 501,
			journalCode: 'VE',
			kind: 'sale',
			posted: true,
		});
		expect(res.installments).toHaveLength(2);
		expect(res.installments[0].accounting).toMatchObject({
			entryId: 502,
			journalCode: 'BQ',
			kind: 'payment',
			posted: true,
		});
		expect(res.installments[0].receivable).toBeNull();
		expect(res.installments[1].receivable).toMatchObject({
			outstanding: 200,
			autoTracked: true,
		});
		expect(res.installments[1].accounting).toBeNull();
	});

	it('listForInvoiceWithFinance — vente non postée si écriture absente', async () => {
		prisma.invoice.findFirst.mockResolvedValue({
			id: 'inv-2',
			number: 'FAC-DRAFT',
			date: new Date('2026-05-01'),
		});
		prisma.invoiceInstallment.findMany.mockResolvedValue([
			{
				id: 3,
				sequence: 1,
				amount: 50,
				dueDate: new Date('2026-06-01'),
				status: 'PENDING',
				paymentId: null,
				paidAt: null,
			},
			{
				id: 4,
				sequence: 2,
				amount: 50,
				dueDate: new Date('2026-07-01'),
				status: 'PENDING',
				paymentId: null,
				paidAt: null,
			},
		]);
		accounting.findPostedEntriesByReferences.mockResolvedValue(new Map());

		const res = await service.listForInvoiceWithFinance('inv-2');

		expect(res.saleAccounting).toMatchObject({
			journalCode: 'VE',
			reference: 'VENTE FAC-DRAFT',
			posted: false,
		});
		expect(res.installments.every((row) => row.receivable?.autoTracked)).toBe(true);
	});

	it('listForInvoiceWithFinance — facture introuvable', async () => {
		prisma.invoice.findFirst.mockResolvedValue(null);
		await expect(service.listForInvoiceWithFinance('missing', 1)).rejects.toBeInstanceOf(
			NotFoundException,
		);
	});
});
