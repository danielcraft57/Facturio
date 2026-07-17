import { Injectable } from '@nestjs/common';
import { TaxesService } from '../../taxes/taxes.service';
import type { FilingCalculator } from './filing-calculator';
import type {
	FilingCalculationResult,
	FilingCalculatorContext,
} from './filing-calculation.types';
import { OrgFiscalSnapshotService } from './org-fiscal-snapshot.service';

/**
 * Calculateur Cotisation Foncière des Entreprises (CFE).
 * Prefs org (valeur locative, taux, activité) + CA annuel.
 */
@Injectable()
export class CfeFilingCalculator implements FilingCalculator {
	readonly supportedTypes = ['CFE'] as const;

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

		const result = await this.taxes.calculateCFE({
			year,
			propertyValue: opt.propertyValue ?? snap.cfePropertyValue ?? undefined,
			revenue: opt.revenue ?? snap.revenueHt,
			activity: opt.activity ?? snap.cfeActivity,
			communalRate: opt.communalRate ?? snap.cfeCommunalRate ?? undefined,
			isFirstYear: opt.isFirstYear ?? false,
		});

		return {
			amountDue: result.amount,
			lines: [
				{
					taxRate: result.rate,
					taxableBase: result.base,
					taxAmount: result.amount,
				},
			],
			notes: result.exemption
				? result.exemptionReason || 'Exonération CFE'
				: `CFE ${year} - base ${result.base} € - taux ${result.rate} %`,
			snapshot: {
				kind: 'CFE',
				year,
				base: result.base,
				rate: result.rate,
				amount: result.amount,
				exemption: result.exemption ?? false,
				exemptionReason: result.exemptionReason,
				revenue: opt.revenue ?? snap.revenueHt,
				activity: opt.activity ?? snap.cfeActivity,
			},
		};
	}
}
