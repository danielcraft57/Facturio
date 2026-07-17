import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type TreasuryDayPoint = {
	date: string;
	inflows: number;
	outflows: number;
	net: number;
	projectedBalance: number;
};

export type TreasuryForecast = {
	asOf: string;
	horizonDays: number;
	openingCash: number;
	closingProjected: number;
	totalInflows: number;
	totalOutflows: number;
	points: TreasuryDayPoint[];
	upcomingReceivables: Array<{ dueDate: string; amount: number; label: string }>;
	upcomingPayables: Array<{ dueDate: string; amount: number; label: string }>;
};

/**
 * Service trésorerie : prévision encaissements / décaissements sur N jours.
 * Agrège factures ouvertes, dettes ouvertes et soldes caisse/banque estimés.
 */
@Injectable()
export class TreasuryService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Vérifie qu'une organisation est présente.
	 * @param organizationId - Identifiant d'organisation
	 */
	private assertOrg(organizationId?: number): number {
		if (organizationId == null) throw new BadRequestException('Organisation requise');
		return organizationId;
	}

	/**
	 * Convertit une valeur Decimal/Prisma en number.
	 * @param n - Valeur brute
	 */
	private toNumber(n: unknown): number {
		if (n == null) return 0;
		return (n as { toNumber?: () => number })?.toNumber?.() ?? Number(n);
	}

	/**
	 * Formate une date en YYYY-MM-DD.
	 * @param d - Date
	 */
	private ymd(d: Date): string {
		return d.toISOString().slice(0, 10);
	}

	/**
	 * Calcule la prévision de trésorerie.
	 * @param organizationId - Organisation
	 * @param days - Horizon (défaut 90)
	 * @returns Prévision jour par jour
	 */
	async getForecast(organizationId?: number, days = 90): Promise<TreasuryForecast> {
		const orgId = this.assertOrg(organizationId);
		const horizon = Math.min(Math.max(days, 7), 365);
		const asOf = new Date();
		asOf.setHours(0, 0, 0, 0);
		const end = new Date(asOf);
		end.setDate(end.getDate() + horizon);

		const [openInvoices, openDebts, cashRegisters, recentPayments] = await Promise.all([
			this.prisma.invoice.findMany({
				where: {
					organizationId: orgId,
					status: { in: ['SENT', 'OVERDUE'] },
					balance: { gt: 0 },
					OR: [{ dueDate: { gte: asOf, lte: end } }, { dueDate: null }],
				},
				select: {
					number: true,
					dueDate: true,
					balance: true,
				},
			}),
			this.prisma.payableDebt.findMany({
				where: {
					organizationId: orgId,
					status: { in: ['OPEN', 'PARTIAL'] },
					archivedAt: null,
					OR: [{ dueDate: { gte: asOf, lte: end } }, { dueDate: null }],
				},
				select: {
					label: true,
					dueDate: true,
					balance: true,
					creditor: { select: { name: true } },
				},
			}),
			this.prisma.cashRegister.findMany({
				where: { organizationId: orgId, isActive: true },
				select: { currentBalance: true },
			}),
			this.prisma.payment.findMany({
				where: {
					invoice: { organizationId: orgId },
					date: { gte: new Date(asOf.getTime() - 30 * 86400000) },
				},
				select: { amount: true },
			}),
		]);

		const cashBalance = cashRegisters.reduce((s, r) => s + this.toNumber(r.currentBalance), 0);
		// Estimation banque : moyenne des encaissements 30 j (proxy simple si pas de rapprochement)
		const recentIn = recentPayments.reduce((s, p) => s + this.toNumber(p.amount), 0);
		const openingCash = cashBalance + recentIn * 0.1; // léger buffer ; le dashboard affiche surtout le delta

		const inflowByDay = new Map<string, number>();
		const outflowByDay = new Map<string, number>();
		const upcomingReceivables: TreasuryForecast['upcomingReceivables'] = [];
		const upcomingPayables: TreasuryForecast['upcomingPayables'] = [];

		for (const inv of openInvoices) {
			const remaining = Math.max(0, this.toNumber(inv.balance));
			if (remaining <= 0) continue;
			const due = inv.dueDate ? new Date(inv.dueDate) : asOf;
			const key = this.ymd(due < asOf ? asOf : due > end ? end : due);
			inflowByDay.set(key, (inflowByDay.get(key) || 0) + remaining);
			upcomingReceivables.push({
				dueDate: key,
				amount: remaining,
				label: `Facture ${inv.number}`,
			});
		}

		for (const debt of openDebts) {
			const bal = this.toNumber(debt.balance);
			if (bal <= 0) continue;
			const due = debt.dueDate ? new Date(debt.dueDate) : asOf;
			const key = this.ymd(due < asOf ? asOf : due > end ? end : due);
			outflowByDay.set(key, (outflowByDay.get(key) || 0) + bal);
			upcomingPayables.push({
				dueDate: key,
				amount: bal,
				label: `${debt.creditor.name} - ${debt.label}`,
			});
		}

		const points: TreasuryDayPoint[] = [];
		let balance = openingCash;
		let totalInflows = 0;
		let totalOutflows = 0;

		for (let i = 0; i <= horizon; i++) {
			const d = new Date(asOf);
			d.setDate(asOf.getDate() + i);
			const key = this.ymd(d);
			const inflows = inflowByDay.get(key) || 0;
			const outflows = outflowByDay.get(key) || 0;
			balance += inflows - outflows;
			totalInflows += inflows;
			totalOutflows += outflows;
			points.push({
				date: key,
				inflows,
				outflows,
				net: inflows - outflows,
				projectedBalance: Math.round(balance * 100) / 100,
			});
		}

		upcomingReceivables.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
		upcomingPayables.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

		return {
			asOf: this.ymd(asOf),
			horizonDays: horizon,
			openingCash: Math.round(openingCash * 100) / 100,
			closingProjected: Math.round(balance * 100) / 100,
			totalInflows: Math.round(totalInflows * 100) / 100,
			totalOutflows: Math.round(totalOutflows * 100) / 100,
			points,
			upcomingReceivables: upcomingReceivables.slice(0, 50),
			upcomingPayables: upcomingPayables.slice(0, 50),
		};
	}
}
