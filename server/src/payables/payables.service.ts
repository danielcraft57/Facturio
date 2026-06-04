import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreatePayableCreditorDto } from './dto/create-payable-creditor.dto';
import type { CreatePayableDebtDto } from './dto/create-payable-debt.dto';
import type { CreatePayableDebtPaymentDto } from './dto/create-payable-debt-payment.dto';
import { attachPayableDebtEmailEngagement } from '../common/email-engagement.util';
import type { EmailEngagementSummary } from '../common/email-engagement.util';
import { resolveEmailIssuerDisplayName } from '../common/email-legal-footer';
import { computeDebtBalance } from './payables-balance.util';
import { OrganizationsService } from '../organizations/organizations.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

const BALANCE_EPSILON = 0.01;

export type PayableDebtRow = {
	id: number;
	creditorId: number;
	creditorName: string;
	creditorEmail: string | null;
	label: string;
	totalAmount: number;
	balance: number;
	totalPaid: number;
	currency: string;
	dueDate: string | null;
	status: string;
	notes: string | null;
	publicToken: string | null;
	createdAt: string;
	emailEngagement: EmailEngagementSummary | null;
};

export type PublicPayableDebtView = {
	label: string;
	totalAmount: number;
	balance: number;
	totalPaid: number;
	currency: string;
	dueDate: string | null;
	notes: string | null;
	status: string;
	creditorName: string;
	issuerName: string;
	createdAt: string;
};

export type PayablesSummaryResponse = {
	summary: {
		totalOutstanding: number;
		creditorCount: number;
		debtCount: number;
	};
	creditors: Array<{
		id: number;
		name: string;
		email: string | null;
		totalBalance: number;
		debtCount: number;
	}>;
	debts: PayableDebtRow[];
};

@Injectable()
export class PayablesService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly organizations: OrganizationsService,
		private readonly realtime: RealtimeEventsService,
	) {}

	private assertOrg(organizationId?: number): number {
		if (organizationId == null) throw new BadRequestException('Organisation requise');
		return organizationId;
	}

	private mapDebt(
		debt: {
			id: number;
			creditorId: number;
			label: string;
			totalAmount: unknown;
			balance: unknown;
			currency: string;
			dueDate: Date | null;
			status: string;
			notes: string | null;
			publicToken: string | null;
			createdAt: Date;
			creditor: { name: string; email: string | null };
			payments: Array<{ amount: unknown }>;
		},
	): PayableDebtRow {
		const totalAmount = Number(debt.totalAmount);
		const paymentAmounts = debt.payments.map((p) => Number(p.amount));
		const { totalPaid } = computeDebtBalance(totalAmount, paymentAmounts);
		return {
			id: debt.id,
			creditorId: debt.creditorId,
			creditorName: debt.creditor.name,
			creditorEmail: debt.creditor.email,
			label: debt.label,
			totalAmount,
			balance: Number(debt.balance),
			totalPaid,
			currency: debt.currency,
			dueDate: debt.dueDate?.toISOString() ?? null,
			status: debt.status,
			notes: debt.notes,
			publicToken: debt.publicToken,
			createdAt: debt.createdAt.toISOString(),
			emailEngagement: null,
		};
	}

	async publicViewByToken(token: string): Promise<PublicPayableDebtView | null> {
		const debt = await this.prisma.payableDebt.findFirst({
			where: { publicToken: token, status: { not: 'CANCELLED' } },
			include: { creditor: true, payments: true },
		});
		if (!debt) return null;

		const organization = await this.organizations.getProfile(debt.organizationId).catch(() => undefined);
		const issuerName = resolveEmailIssuerDisplayName(organization);
		const totalAmount = Number(debt.totalAmount);
		const paymentAmounts = debt.payments.map((p) => Number(p.amount));
		const { totalPaid, balance } = computeDebtBalance(totalAmount, paymentAmounts);

		return {
			label: debt.label,
			totalAmount,
			balance,
			totalPaid,
			currency: debt.currency,
			dueDate: debt.dueDate?.toISOString() ?? null,
			notes: debt.notes,
			status: debt.status,
			creditorName: debt.creditor.name,
			issuerName,
			createdAt: debt.createdAt.toISOString(),
		};
	}

	async syncDebtBalance(debtId: number, organizationId: number) {
		const debt = await this.prisma.payableDebt.findFirst({
			where: { id: debtId, organizationId, status: { not: 'CANCELLED' } },
			include: { payments: true },
		});
		if (!debt) throw new NotFoundException('Dette introuvable');

		const totalAmount = Number(debt.totalAmount);
		const paymentAmounts = debt.payments.map((p) => Number(p.amount));
		const { balance, status } = computeDebtBalance(totalAmount, paymentAmounts);

		return this.prisma.payableDebt.update({
			where: { id: debtId },
			data: { balance, status },
			include: { creditor: true, payments: { orderBy: { date: 'desc' } } },
		});
	}

	async createCreditor(organizationId: number | undefined, dto: CreatePayableCreditorDto) {
		const orgId = this.assertOrg(organizationId);
		return this.prisma.payableCreditor.create({
			data: {
				organizationId: orgId,
				name: dto.name.trim(),
				email: dto.email?.trim() || null,
				notes: dto.notes?.trim() || null,
			},
		});
	}

	async listCreditors(organizationId: number | undefined) {
		const orgId = this.assertOrg(organizationId);
		return this.prisma.payableCreditor.findMany({
			where: { organizationId: orgId },
			orderBy: { name: 'asc' },
		});
	}

	async createDebt(organizationId: number | undefined, dto: CreatePayableDebtDto) {
		const orgId = this.assertOrg(organizationId);
		const creditor = await this.prisma.payableCreditor.findFirst({
			where: { id: dto.creditorId, organizationId: orgId },
		});
		if (!creditor) throw new NotFoundException('Créancier introuvable');

		const totalAmount = Number(dto.totalAmount.toFixed(2));
		const debt = await this.prisma.payableDebt.create({
			data: {
				organizationId: orgId,
				creditorId: dto.creditorId,
				label: dto.label.trim(),
				totalAmount,
				balance: totalAmount,
				status: 'OPEN',
				dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
				notes: dto.notes?.trim() || null,
			},
			include: { creditor: true, payments: true },
		});
		return this.mapDebt(debt);
	}

	async recordPayment(
		organizationId: number | undefined,
		debtId: number,
		dto: CreatePayableDebtPaymentDto,
	) {
		const orgId = this.assertOrg(organizationId);
		const debt = await this.prisma.payableDebt.findFirst({
			where: { id: debtId, organizationId: orgId, status: { not: 'CANCELLED' } },
			include: { payments: true },
		});
		if (!debt) throw new NotFoundException('Dette introuvable');
		if (debt.status === 'PAID') {
			throw new BadRequestException('Cette dette est déjà soldée.');
		}

		const balance = Number(debt.balance);
		const amount = Number(dto.amount.toFixed(2));
		if (amount > balance + BALANCE_EPSILON) {
			throw new BadRequestException(
				`Le montant (${amount}) dépasse le solde restant (${balance})`,
			);
		}

		await this.prisma.payableDebtPayment.create({
			data: {
				debtId,
				amount,
				date: dto.date ? new Date(dto.date) : new Date(),
				method: dto.method?.trim() || null,
				notes: dto.notes?.trim() || null,
			},
		});

		const updated = await this.syncDebtBalance(debtId, orgId);
		const row = this.mapDebt(updated);
		this.realtime.emit(orgId, 'payables', 'updated', String(debtId), {
			number: row.label,
			status: row.status,
		});
		return row;
	}

	/** Annulation comptable : pas de suppression — trace conservée. */
	async cancelDebt(organizationId: number | undefined, debtId: number) {
		const orgId = this.assertOrg(organizationId);
		const debt = await this.prisma.payableDebt.findFirst({
			where: { id: debtId, organizationId: orgId },
		});
		if (!debt) throw new NotFoundException('Dette introuvable');
		if (debt.status === 'CANCELLED') {
			throw new BadRequestException('Cette dette est déjà annulée.');
		}
		if (debt.status === 'PAID') {
			throw new BadRequestException(
				'Impossible d’annuler une dette soldée : l’historique des remboursements est conservé.',
			);
		}

		const updated = await this.prisma.payableDebt.update({
			where: { id: debtId },
			data: { status: 'CANCELLED', balance: 0 },
			include: { creditor: true, payments: { orderBy: { date: 'desc' } } },
		});
		return this.mapDebt(updated);
	}

	async getSummary(organizationId: number | undefined): Promise<PayablesSummaryResponse> {
		const orgId = this.assertOrg(organizationId);

		const debts = await this.prisma.payableDebt.findMany({
			where: { organizationId: orgId, status: { not: 'CANCELLED' } },
			include: {
				creditor: true,
				payments: true,
			},
			orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
		});

		const rows = await attachPayableDebtEmailEngagement(
			this.prisma,
			debts.map((d) => this.mapDebt(d)),
		);

		const openRows = rows.filter((r) => r.balance > BALANCE_EPSILON);

		const creditorMap = new Map<
			number,
			{ id: number; name: string; email: string | null; totalBalance: number; debtCount: number }
		>();

		for (const row of openRows) {
			const debt = debts.find((d) => d.id === row.id)!;
			let entry = creditorMap.get(row.creditorId);
			if (!entry) {
				entry = {
					id: row.creditorId,
					name: row.creditorName,
					email: debt.creditor.email,
					totalBalance: 0,
					debtCount: 0,
				};
				creditorMap.set(row.creditorId, entry);
			}
			entry.totalBalance = Number((entry.totalBalance + row.balance).toFixed(2));
			entry.debtCount += 1;
		}

		const totalOutstanding = Number(
			openRows.reduce((sum, r) => sum + r.balance, 0).toFixed(2),
		);

		return {
			summary: {
				totalOutstanding,
				creditorCount: creditorMap.size,
				debtCount: openRows.length,
			},
			creditors: [...creditorMap.values()].sort((a, b) => b.totalBalance - a.totalBalance),
			debts: rows,
		};
	}

	async findOneDebt(organizationId: number | undefined, debtId: number) {
		const orgId = this.assertOrg(organizationId);
		const debt = await this.prisma.payableDebt.findFirst({
			where: { id: debtId, organizationId: orgId },
			include: { creditor: true, payments: { orderBy: { date: 'desc' } } },
		});
		if (!debt) throw new NotFoundException('Dette introuvable');
		const [row] = await attachPayableDebtEmailEngagement(this.prisma, [this.mapDebt(debt)]);
		return {
			...row,
			payments: debt.payments.map((p) => ({
				id: p.id,
				amount: Number(p.amount),
				date: p.date.toISOString(),
				method: p.method,
				notes: p.notes,
			})),
		};
	}
}
