import { ConflictException } from '@nestjs/common';
import { AmortizationsService } from '../taxes/amortizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';

/**
 * Tests comptabilisation des dotations d'amortissement.
 */
describe('AmortizationsService.postYearToAccounting', () => {
	const prisma = {
		amortization: {
			findFirst: jest.fn(),
			findMany: jest.fn(),
			create: jest.fn(),
			delete: jest.fn(),
		},
		journalEntry: {
			findFirst: jest.fn(),
		},
	};
	const accounting = { postEntry: jest.fn() };
	let service: AmortizationsService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new AmortizationsService(
			prisma as unknown as PrismaService,
			accounting as unknown as AccountingService,
		);
	});

	it('poste 681/281 pour une année', async () => {
		prisma.amortization.findFirst.mockResolvedValue({
			id: 4,
			organizationId: 1,
			assetName: 'MacBook',
			schedule: [
				{ year: 2025, amount: 500 },
				{ year: 2026, amount: 500 },
			],
		});
		prisma.journalEntry.findFirst.mockResolvedValue(null);
		accounting.postEntry.mockResolvedValue({ id: 99 });

		const result = await service.postYearToAccounting(1, 4, 2025);

		expect(result.reference).toBe('AMO-4-2025');
		expect(result.amount).toBe(500);
		expect(accounting.postEntry).toHaveBeenCalledWith(
			expect.objectContaining({
				journalCode: 'OD',
				reference: 'AMO-4-2025',
				lines: expect.arrayContaining([
					expect.objectContaining({ accountCode: '681', debit: 500 }),
					expect.objectContaining({ accountCode: '281', credit: 500 }),
				]),
			}),
		);
	});

	it('refuse si déjà comptabilisé', async () => {
		prisma.amortization.findFirst.mockResolvedValue({
			id: 4,
			organizationId: 1,
			assetName: 'MacBook',
			schedule: [{ year: 2025, amount: 500 }],
		});
		prisma.journalEntry.findFirst.mockResolvedValue({ id: 1 });

		await expect(service.postYearToAccounting(1, 4, 2025)).rejects.toBeInstanceOf(
			ConflictException,
		);
	});
});
