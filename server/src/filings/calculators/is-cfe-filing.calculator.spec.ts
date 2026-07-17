import { IsFilingCalculator } from './is-filing.calculator';
import { CfeFilingCalculator } from './cfe-filing.calculator';
import { OrgFiscalSnapshotService } from './org-fiscal-snapshot.service';
import { TaxesService } from '../../taxes/taxes.service';

const baseSnap = {
	organizationId: 1,
	year: 2025,
	revenueHt: 100000,
	expenses: 60000,
	amortizations: 2000,
	invoiceCount: 12,
	isPmeEligible: true,
	capitalHeldByIndividuals: 100,
	cfePropertyValue: null as number | null,
	cfeCommunalRate: null as number | null,
	cfeActivity: 'SERVICE' as const,
};

/**
 * Tests calculateurs IS et CFE.
 */
describe('IsFilingCalculator', () => {
	const snapshot = { buildYearSnapshot: jest.fn() };
	const taxes = { calculateIS: jest.fn() };
	let calculator: IsFilingCalculator;

	beforeEach(() => {
		jest.clearAllMocks();
		calculator = new IsFilingCalculator(
			snapshot as unknown as OrgFiscalSnapshotService,
			taxes as unknown as TaxesService,
		);
		snapshot.buildYearSnapshot.mockResolvedValue(baseSnap);
	});

	it('délègue à TaxesService avec le snapshot org', async () => {
		taxes.calculateIS.mockResolvedValue({
			accountingResult: 40000,
			fiscalResult: 38000,
			taxableIncome: 38000,
			corporateTax: 5700,
			effectiveRate: 15,
			calculationDetails: [
				{ tranche: '0 - 42 500€', base: 38000, rate: 15, tax: 5700 },
			],
			pmeReduction: undefined,
		});

		const result = await calculator.calculate({
			filingId: 1,
			organizationId: 1,
			type: 'IS',
			periodStart: new Date('2025-01-01'),
			periodEnd: new Date('2025-12-31'),
		});

		expect(taxes.calculateIS).toHaveBeenCalledWith(
			expect.objectContaining({
				year: 2025,
				revenue: 100000,
				expenses: 60000,
				amortizations: 2000,
				isPME: true,
			}),
		);
		expect(result.amountDue).toBe(5700);
		expect(result.snapshot).toMatchObject({ kind: 'IS', corporateTax: 5700 });
	});

	it('accepte des options de surcharge', async () => {
		taxes.calculateIS.mockResolvedValue({
			accountingResult: 0,
			fiscalResult: 0,
			taxableIncome: 0,
			corporateTax: 0,
			effectiveRate: 0,
			calculationDetails: [],
		});

		await calculator.calculate({
			filingId: 1,
			organizationId: 1,
			type: 'IS',
			periodStart: new Date('2025-01-01'),
			periodEnd: new Date('2025-12-31'),
			options: { revenue: 50000, expenses: 40000, isPME: false },
		});

		expect(taxes.calculateIS).toHaveBeenCalledWith(
			expect.objectContaining({ revenue: 50000, expenses: 40000, isPME: false }),
		);
	});
});

describe('CfeFilingCalculator', () => {
	const snapshot = { buildYearSnapshot: jest.fn() };
	const taxes = { calculateCFE: jest.fn() };
	let calculator: CfeFilingCalculator;

	beforeEach(() => {
		jest.clearAllMocks();
		calculator = new CfeFilingCalculator(
			snapshot as unknown as OrgFiscalSnapshotService,
			taxes as unknown as TaxesService,
		);
		snapshot.buildYearSnapshot.mockResolvedValue(baseSnap);
	});

	it('calcule la CFE via forfait CA si pas de valeur locative', async () => {
		taxes.calculateCFE.mockResolvedValue({
			base: 10000,
			rate: 1,
			amount: 100,
		});

		const result = await calculator.calculate({
			filingId: 2,
			organizationId: 1,
			type: 'CFE',
			periodStart: new Date('2025-01-01'),
			periodEnd: new Date('2025-12-31'),
		});

		expect(taxes.calculateCFE).toHaveBeenCalledWith(
			expect.objectContaining({
				year: 2025,
				revenue: 100000,
				activity: 'SERVICE',
			}),
		);
		expect(result.amountDue).toBe(100);
		expect(result.snapshot).toMatchObject({ kind: 'CFE', amount: 100 });
	});

	it('gère l\'exonération première année', async () => {
		taxes.calculateCFE.mockResolvedValue({
			base: 0,
			rate: 0,
			amount: 0,
			exemption: true,
			exemptionReason: "Exonération première année d'activité",
		});

		const result = await calculator.calculate({
			filingId: 3,
			organizationId: 1,
			type: 'CFE',
			periodStart: new Date('2025-01-01'),
			periodEnd: new Date('2025-12-31'),
			options: { isFirstYear: true },
		});

		expect(result.amountDue).toBe(0);
		expect(result.notes).toContain('Exonération');
	});
});
