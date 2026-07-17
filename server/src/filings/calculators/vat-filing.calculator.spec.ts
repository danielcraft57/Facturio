import { VatFilingCalculator } from './vat-filing.calculator';
import { OrgFiscalSnapshotService } from './org-fiscal-snapshot.service';

/**
 * Tests calculateur TVA (collectée - déductible).
 */
describe('VatFilingCalculator', () => {
	const snapshot = {
		buildPeriodRevenue: jest.fn(),
		periodVatDeductible: jest.fn(),
	};

	let calculator: VatFilingCalculator;

	beforeEach(() => {
		jest.clearAllMocks();
		calculator = new VatFilingCalculator(snapshot as unknown as OrgFiscalSnapshotService);
	});

	it('calcule la TVA nette positive', async () => {
		snapshot.buildPeriodRevenue.mockResolvedValue({
			revenueHt: 10000,
			vatCollected: 2000,
			invoiceCount: 3,
		});
		snapshot.periodVatDeductible.mockResolvedValue(500);

		const result = await calculator.calculate({
			filingId: 1,
			organizationId: 10,
			type: 'VAT_CA3',
			periodStart: new Date('2026-01-01'),
			periodEnd: new Date('2026-03-31'),
		});

		expect(result.amountDue).toBe(1500);
		expect(result.lines).toHaveLength(2);
		expect(result.snapshot).toMatchObject({
			kind: 'VAT',
			vatCollected: 2000,
			vatDeductible: 500,
			amountDue: 1500,
		});
	});

	it('ne renvoie pas de montant négatif si déductible > collectée', async () => {
		snapshot.buildPeriodRevenue.mockResolvedValue({
			revenueHt: 1000,
			vatCollected: 200,
			invoiceCount: 1,
		});
		snapshot.periodVatDeductible.mockResolvedValue(800);

		const result = await calculator.calculate({
			filingId: 2,
			organizationId: 10,
			type: 'VAT_CA12',
			periodStart: new Date('2026-01-01'),
			periodEnd: new Date('2026-12-31'),
		});

		expect(result.amountDue).toBe(0);
	});
});
