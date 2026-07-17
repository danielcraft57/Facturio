import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AmortizationsService } from '../../taxes/amortizations.service';

/**
 * Snapshot fiscal annuel d'une organisation.
 * Source unique pour IS / CFE / simulations - évite de recalculer partout.
 */
export type OrgFiscalSnapshot = {
	organizationId: number;
	year: number;
	revenueHt: number;
	expenses: number;
	amortizations: number;
	invoiceCount: number;
	isPmeEligible: boolean;
	capitalHeldByIndividuals: number;
	cfePropertyValue: number | null;
	cfeCommunalRate: number | null;
	cfeActivity: 'SERVICE' | 'COMMERCE' | 'INDUSTRIE' | 'ARTISANAT';
};

/**
 * Agrège CA, charges et prefs fiscales d'une org pour une année.
 */
@Injectable()
export class OrgFiscalSnapshotService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly amortizations: AmortizationsService,
	) {}

	/**
	 * Convertit Decimal Prisma en number.
	 * @param n - Valeur brute
	 */
	private toNumber(n: unknown): number {
		if (n == null) return 0;
		return (n as { toNumber?: () => number })?.toNumber?.() ?? Number(n);
	}

	/**
	 * Construit le snapshot fiscal pour une année civile.
	 * @param organizationId - Organisation
	 * @param year - Année
	 */
	async buildYearSnapshot(organizationId: number, year: number): Promise<OrgFiscalSnapshot> {
		if (!organizationId) throw new BadRequestException('Organisation requise');

		const start = new Date(year, 0, 1);
		const end = new Date(year, 11, 31, 23, 59, 59, 999);

		const [org, invoices, expenseLines, amortTotals] = await Promise.all([
			this.prisma.organization.findUnique({
				where: { id: organizationId },
				select: {
					isPmeEligible: true,
					capitalHeldByIndividuals: true,
					cfePropertyValue: true,
					cfeCommunalRate: true,
					cfeActivity: true,
				},
			}),
			this.prisma.invoice.findMany({
				where: {
					organizationId,
					date: { gte: start, lte: end },
					status: { in: ['SENT', 'PAID', 'OVERDUE'] },
				},
				select: { subtotal: true },
			}),
			this.prisma.journalLine.findMany({
				where: {
					account: { type: 'EXPENSE' },
					entry: {
						status: 'POSTED',
						organizationId,
						date: { gte: start, lte: end },
					},
				},
				select: { debit: true, credit: true },
			}),
			this.amortizations.getTotalAmortizations(organizationId, year).catch(() => ({
				total: 0,
			})),
		]);

		if (!org) throw new BadRequestException('Organisation introuvable');

		let revenueHt = 0;
		for (const inv of invoices) {
			revenueHt += this.toNumber(inv.subtotal);
		}

		let expenses = 0;
		for (const line of expenseLines) {
			expenses += this.toNumber(line.debit) - this.toNumber(line.credit);
		}
		expenses = Math.max(0, expenses);

		const activity = (org.cfeActivity || 'SERVICE') as OrgFiscalSnapshot['cfeActivity'];
		const allowed = ['SERVICE', 'COMMERCE', 'INDUSTRIE', 'ARTISANAT'];
		const cfeActivity = allowed.includes(activity) ? activity : 'SERVICE';

		return {
			organizationId,
			year,
			revenueHt: Math.round(revenueHt * 100) / 100,
			expenses: Math.round(expenses * 100) / 100,
			amortizations: Math.round(Number(amortTotals.total || 0) * 100) / 100,
			invoiceCount: invoices.length,
			isPmeEligible: org.isPmeEligible !== false,
			capitalHeldByIndividuals: this.toNumber(org.capitalHeldByIndividuals) || 100,
			cfePropertyValue:
				org.cfePropertyValue != null ? this.toNumber(org.cfePropertyValue) : null,
			cfeCommunalRate:
				org.cfeCommunalRate != null ? this.toNumber(org.cfeCommunalRate) : null,
			cfeActivity,
		};
	}

	/**
	 * Snapshot CA / TVA collectée sur une période (TVA).
	 * @param organizationId - Organisation
	 * @param start - Début
	 * @param end - Fin
	 */
	async buildPeriodRevenue(
		organizationId: number,
		start: Date,
		end: Date,
	): Promise<{ revenueHt: number; vatCollected: number; invoiceCount: number }> {
		const invoices = await this.prisma.invoice.findMany({
			where: {
				organizationId,
				date: { gte: start, lte: end },
				status: { in: ['SENT', 'PAID', 'OVERDUE'] },
			},
			select: { subtotal: true, tax: true },
		});
		let revenueHt = 0;
		let vatCollected = 0;
		for (const inv of invoices) {
			revenueHt += this.toNumber(inv.subtotal);
			vatCollected += this.toNumber(inv.tax);
		}
		return {
			revenueHt: Math.round(revenueHt * 100) / 100,
			vatCollected: Math.round(vatCollected * 100) / 100,
			invoiceCount: invoices.length,
		};
	}

	/**
	 * TVA déductible via écritures 44566 sur la période.
	 * @param organizationId - Organisation
	 * @param start - Début
	 * @param end - Fin
	 */
	async periodVatDeductible(
		organizationId: number,
		start: Date,
		end: Date,
	): Promise<number> {
		const lines = await this.prisma.journalLine.findMany({
			where: {
				account: { code: '44566' },
				entry: {
					status: 'POSTED',
					organizationId,
					date: { gte: start, lte: end },
				},
			},
			select: { debit: true, credit: true },
		});
		let total = 0;
		for (const line of lines) {
			total += this.toNumber(line.debit) - this.toNumber(line.credit);
		}
		return Math.max(0, Math.round(total * 100) / 100);
	}
}
