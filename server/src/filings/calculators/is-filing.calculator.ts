import { Injectable } from '@nestjs/common';
import { TaxesService } from '../../taxes/taxes.service';
import type { FilingCalculator } from './filing-calculator';
import type {
	FilingCalculationResult,
	FilingCalculatorContext,
} from './filing-calculation.types';
import { OrgFiscalSnapshotService } from './org-fiscal-snapshot.service';

/**
 * Calculateur Impôt sur les Sociétés (IS).
 * S'appuie sur OrgFiscalSnapshot + TaxesService.calculateIS.
 */
@Injectable()
export class IsFilingCalculator implements FilingCalculator {
	readonly supportedTypes = ['IS'] as const;

	constructor(
		private readonly snapshot: OrgFiscalSnapshotService,
		private readonly taxes: TaxesService,
	) {}

	/**
	 * @param ctx - Contexte déclaration
	 */
	async calculate(ctx: FilingCalculatorContext): Promise<FilingCalculationResult> {
		const year = ctx.periodStart.getFullYear();
		const snap = await this.snapshot.buildYearSnapshot(ctx.organizationId, year);
		const opt = ctx.options || {};

		const revenue = opt.revenue ?? snap.revenueHt;
		const expenses = opt.expenses ?? snap.expenses;
		const amortizations = opt.amortizations ?? snap.amortizations;

		const result = await this.taxes.calculateIS({
			year,
			revenue,
			expenses,
			amortizations,
			fiscalDeductions: opt.fiscalDeductions,
			fiscalReintegrations: opt.fiscalReintegrations,
			lossCarryForward: opt.lossCarryForward,
			isPME: opt.isPME ?? snap.isPmeEligible,
			capitalHeldByIndividuals:
				opt.capitalHeldByIndividuals ?? snap.capitalHeldByIndividuals,
		});

		const lines = (result.calculationDetails || []).map((d) => ({
			taxRate: d.rate,
			taxableBase: d.base,
			taxAmount: Math.round(d.tax * 100) / 100,
		}));

		if (lines.length === 0) {
			lines.push({
				taxRate: result.effectiveRate,
				taxableBase: result.taxableIncome,
				taxAmount: result.corporateTax,
			});
		}

		return {
			amountDue: result.corporateTax,
			lines,
			notes: `IS ${year} - résultat fiscal ${result.taxableIncome} € - taux effectif ${result.effectiveRate} %`,
			snapshot: {
				kind: 'IS',
				year,
				revenue,
				expenses,
				amortizations,
				accountingResult: result.accountingResult,
				fiscalResult: result.fiscalResult,
				taxableIncome: result.taxableIncome,
				corporateTax: result.corporateTax,
				effectiveRate: result.effectiveRate,
				pmeReduction: result.pmeReduction,
				calculationDetails: result.calculationDetails,
				invoiceCount: snap.invoiceCount,
			},
		};
	}
}
