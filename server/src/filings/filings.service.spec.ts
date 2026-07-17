import { BadRequestException } from '@nestjs/common';
import { FilingsService } from './filings.service';
import { PrismaService } from '../prisma/prisma.service';
import { FilingCalculatorRegistry } from './calculators/filing-calculator.registry';

/**
 * Tests essentiels FilingsService (périodes + calculate).
 */
describe('FilingsService', () => {
	const prisma = {
		filing: {
			create: jest.fn(),
			findMany: jest.fn(),
			findFirst: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
		authorityPayment: {
			create: jest.fn(),
			aggregate: jest.fn(),
		},
	};

	const calculators = {
		get: jest.fn(),
	};

	let service: FilingsService;

	beforeEach(() => {
		jest.clearAllMocks();
		service = new FilingsService(
			prisma as unknown as PrismaService,
			calculators as unknown as FilingCalculatorRegistry,
		);
	});

	describe('create - parsing période', () => {
		it('parse une année pour IS', async () => {
			prisma.filing.create.mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

			await service.create({
				type: 'IS',
				period: '2025',
				organizationId: 1,
			});

			expect(prisma.filing.create).toHaveBeenCalledWith({
				data: expect.objectContaining({
					type: 'IS',
					periodStart: new Date(2025, 0, 1),
					periodEnd: new Date(2025, 11, 31),
					organizationId: 1,
				}),
			});
		});

		it('parse un trimestre TVA', async () => {
			prisma.filing.create.mockImplementation(({ data }) => Promise.resolve({ id: 2, ...data }));

			await service.create({ type: 'VAT_CA3', period: '2026-Q1', organizationId: 1 });

			const arg = prisma.filing.create.mock.calls[0][0].data;
			expect(arg.periodStart).toEqual(new Date(2026, 0, 1));
			expect(arg.periodEnd).toEqual(new Date(2026, 2, 31));
		});

		it('refuse un format invalide', () => {
			expect(() =>
				service.create({ type: 'IS', period: 'pas-valide', organizationId: 1 }),
			).toThrow(BadRequestException);
		});
	});

	describe('calculate', () => {
		it('persiste amountDue, lines et calculationSnapshot', async () => {
			const filing = {
				id: 5,
				type: 'IS',
				organizationId: 1,
				periodStart: new Date('2025-01-01'),
				periodEnd: new Date('2025-12-31'),
				status: 'DRAFT',
				lines: [],
				payments: [],
			};
			prisma.filing.findFirst.mockResolvedValue(filing);
			prisma.filing.update.mockResolvedValue({ ...filing, status: 'CALCULATED' });
			calculators.get.mockReturnValue({
				calculate: jest.fn().mockResolvedValue({
					amountDue: 1200,
					lines: [{ taxRate: 15, taxableBase: 8000, taxAmount: 1200 }],
					notes: 'IS 2025',
					snapshot: { kind: 'IS', corporateTax: 1200 },
				}),
			});

			const result = await service.calculate(5, 1);

			expect(prisma.filing.update).toHaveBeenCalledWith({
				where: { id: 5 },
				data: expect.objectContaining({
					status: 'CALCULATED',
					amountDue: 1200,
					calculationSnapshot: { kind: 'IS', corporateTax: 1200 },
				}),
			});
			expect(result.amountDue).toBe(1200);
		});
	});
});
