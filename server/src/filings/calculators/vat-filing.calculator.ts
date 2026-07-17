import { Injectable } from '@nestjs/common';
import type { FilingCalculator } from './filing-calculator';
import type {
	FilingCalculationResult,
	FilingCalculatorContext,
} from './filing-calculation.types';
import { OrgFiscalSnapshotService } from './org-fiscal-snapshot.service';

/**
 * Calculateur TVA CA3 / CA12 : collectée (factures) - déductible (44566).
 */
@Injectable()
export class VatFilingCalculator implements FilingCalculator {
	readonly supportedTypes = ['VAT_CA3', 'VAT_CA12'] as const;

	constructor(private readonly snapshot: OrgFiscalSnapshotService) {}

	/**
	 * @param ctx - Contexte déclaration
	 */
	async calculate(ctx: FilingCalculatorContext): Promise<FilingCalculationResult> {
		const end = new Date(ctx.periodEnd);
		end.setHours(23, 59, 59, 999);

		const [revenue, vatDeductible] = await Promise.all([
			this.snapshot.buildPeriodRevenue(ctx.organizationId, ctx.periodStart, end),
			this.snapshot.periodVatDeductible(ctx.organizationId, ctx.periodStart, end),
		]);

		const vatCollected = revenue.vatCollected;
		const amountDue = Math.round(Math.max(0, vatCollected - vatDeductible) * 100) / 100;

		return {
			amountDue,
			lines: [
				{ taxRate: 0, taxableBase: revenue.revenueHt, taxAmount: vatCollected },
				{ taxRate: 0, taxableBase: 0, taxAmount: -vatDeductible },
			],
			notes: `TVA nette = collectée ${vatCollected} - déductible ${vatDeductible}`,
			snapshot: {
				kind: 'VAT',
				vatCollected,
				vatDeductible,
				vatAmount: amountDue,
				revenueHt: revenue.revenueHt,
				totalAmount: revenue.revenueHt,
				invoiceCount: revenue.invoiceCount,
				amountDue,
			},
		};
	}
}
