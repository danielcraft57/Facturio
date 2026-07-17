import { BadRequestException } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AccountingService } from '../accounting/accounting.service';

/**
 * Tests investissements / apports.
 */
describe('InvestmentsService', () => {
	const prisma = {
		investor: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
		},
		investment: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
		},
	};

	const accounting = { postEntry: jest.fn() };

	let service: InvestmentsService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new InvestmentsService(
			prisma as unknown as PrismaService,
			accounting as unknown as AccountingService,
		);
	});

	it('exige une organisation', async () => {
		await expect(service.listInvestments(undefined)).rejects.toThrow(BadRequestException);
	});

	it('crée un apport et poste en compta si demandé', async () => {
		prisma.investment.create.mockResolvedValue({
			id: 4,
			label: 'Apport Loïc',
			amount: 5000,
			type: 'CAPITAL_CONTRIBUTION',
			investor: null,
		});
		accounting.postEntry.mockResolvedValue({ id: 99 });

		await service.createInvestment(1, {
			label: 'Apport Loïc',
			amount: 5000,
			date: '2026-01-15',
			type: 'CAPITAL_CONTRIBUTION',
			postAccounting: true,
		});

		expect(accounting.postEntry).toHaveBeenCalledWith(
			expect.objectContaining({
				journalCode: 'OD',
				reference: 'INV-4',
				lines: expect.arrayContaining([
					expect.objectContaining({ accountCode: '512' }),
					expect.objectContaining({ accountCode: '101' }),
				]),
			}),
		);
	});

	it('agrège le résumé des investissements actifs', async () => {
		prisma.investment.findMany.mockResolvedValue([
			{ amount: 1000, type: 'CAPITAL_CONTRIBUTION' },
			{ amount: 500, type: 'LOAN' },
		]);
		const summary = await service.getSummary(1);
		expect(summary.totalActive).toBe(1500);
		expect(summary.count).toBe(2);
		expect(summary.byType.LOAN).toBe(500);
	});
});
