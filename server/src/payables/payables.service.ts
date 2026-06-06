import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AccountingService } from '../accounting/accounting.service';
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
import {
	buildDocumentFolderWhere,
	type DocumentFolder,
	DOCUMENT_FOLDERS,
	documentFolderOrderBy,
	parseTagsJson,
	serializeTagsJson,
} from '../common/document-folder.util';
import { groupByYearAndMonth } from '../common/archive-group.util';
import type { PayableDebtListQueryDto } from './dto/payable-debt-document-folder.dto';
import type { UpdatePayableDebtDocumentFlagsDto } from './dto/payable-debt-document-folder.dto';

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
	archivedAt?: string | null;
	starred?: boolean;
	important?: boolean;
	snoozedUntil?: string | null;
	seenAt?: string | null;
	sentAt?: string | null;
	tags?: string[];
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
	private readonly logger = new Logger(PayablesService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly organizations: OrganizationsService,
		private readonly realtime: RealtimeEventsService,
		private readonly accounting: AccountingService,
	) {}

	/** Écriture achat 622/401 — idempotente (envoi ou 1er paiement). */
	async postPurchaseOnRecognition(debtId: number, date?: Date): Promise<void> {
		try {
			await this.accounting.postPayableDebtPurchase({ debtId, date });
		} catch (err) {
			this.logger.warn(`Compta achat dette ${debtId}: ${(err as Error).message}`);
		}
	}

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
			archivedAt?: Date | null;
			starred?: boolean;
			important?: boolean;
			snoozedUntil?: Date | null;
			seenAt?: Date | null;
			sentAt?: Date | null;
			tags?: string | null;
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
			archivedAt: debt.archivedAt?.toISOString() ?? null,
			starred: debt.starred ?? false,
			important: debt.important ?? false,
			snoozedUntil: debt.snoozedUntil?.toISOString() ?? null,
			seenAt: debt.seenAt?.toISOString() ?? null,
			sentAt: debt.sentAt?.toISOString() ?? null,
			tags: parseTagsJson(debt.tags),
		};
	}

	async findAllDebts(organizationId: number | undefined, query?: PayableDebtListQueryDto) {
		const orgId = this.assertOrg(organizationId);
		const q = query ?? {};
		const page = q.page ?? 1;
		const pageSize = q.pageSize ?? q.limit ?? 30;
		const skip = (page - 1) * pageSize;
		const now = new Date();

		const folderWhere = buildDocumentFolderWhere(q.folder, now, 'payable_debt');
		const where: Record<string, unknown> = {
			organizationId: orgId,
			archivedAt: null,
			...folderWhere,
		};
		if (q.folder !== 'status_cancelled' && !('status' in folderWhere)) {
			where.status = { not: 'CANCELLED' };
		}

		if (q.search?.trim()) {
			const term = q.search.trim();
			where.OR = [
				{ label: { contains: term } },
				{ creditor: { name: { contains: term } } },
				{ notes: { contains: term } },
			];
		}

		const [items, total] = await this.prisma.$transaction([
			this.prisma.payableDebt.findMany({
				skip,
				take: pageSize,
				where: where as never,
				orderBy: q.folder ? documentFolderOrderBy('payable_debt') : { createdAt: 'desc' },
				include: { creditor: true, payments: true },
			}),
			this.prisma.payableDebt.count({ where: where as never }),
		]);

		const folderCounts =
			q.includeFolderCounts && page === 1
				? await this.loadFolderCounts(orgId)
				: undefined;

		const debts = await attachPayableDebtEmailEngagement(
			this.prisma,
			items.map((d) => this.mapDebt(d)),
		);

		return {
			debts,
			total,
			page,
			limit: pageSize,
			totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
			...(folderCounts ? { folderCounts } : {}),
		};
	}

	private payableDebtCountWhere(organizationId: number, folder: DocumentFolder, now = new Date()) {
		const folderWhere = buildDocumentFolderWhere(folder, now, 'payable_debt');
		const where: Record<string, unknown> = {
			organizationId,
			archivedAt: null,
			...folderWhere,
		};
		if (folder !== 'status_cancelled' && !('status' in folderWhere)) {
			where.status = { not: 'CANCELLED' };
		}
		return where;
	}

	private async loadFolderCounts(organizationId: number) {
		const now = new Date();
		const counts = await Promise.all(
			DOCUMENT_FOLDERS.map(async (folder) => {
				const count = await this.prisma.payableDebt.count({
					where: this.payableDebtCountWhere(organizationId, folder, now) as never,
				});
				return [folder, count] as const;
			}),
		);
		const archives = await this.prisma.payableDebt.count({
			where: { organizationId, archivedAt: { not: null } },
		});
		return { ...Object.fromEntries(counts), archives };
	}

	async getFolderCounts(organizationId: number | undefined) {
		const orgId = this.assertOrg(organizationId);
		return this.loadFolderCounts(orgId);
	}

	async updateDocumentFlags(
		organizationId: number | undefined,
		debtId: number,
		dto: UpdatePayableDebtDocumentFlagsDto,
	) {
		const orgId = this.assertOrg(organizationId);
		await this.findOneDebt(orgId, debtId);
		const data: Record<string, unknown> = {};
		if (dto.starred !== undefined) data.starred = dto.starred;
		if (dto.important !== undefined) data.important = dto.important;
		if (dto.snoozedUntil !== undefined) {
			data.snoozedUntil = dto.snoozedUntil ? new Date(dto.snoozedUntil) : null;
		}
		if (dto.tags !== undefined) data.tags = serializeTagsJson(dto.tags);
		if (dto.markSeen) data.seenAt = new Date();

		const updated = await this.prisma.payableDebt.update({
			where: { id: debtId },
			data,
			include: { creditor: true, payments: true },
		});
		const row = this.mapDebt(updated);
		this.realtime.emit(orgId, 'payables', 'updated', String(debtId), {
			number: row.label,
			status: row.status,
		});
		return row;
	}

	async archiveDebt(organizationId: number | undefined, debtId: number) {
		const orgId = this.assertOrg(organizationId);
		const debt = await this.prisma.payableDebt.findFirst({
			where: { id: debtId, organizationId: orgId },
		});
		if (!debt) throw new NotFoundException('Dette introuvable');
		if (debt.archivedAt) {
			throw new BadRequestException('Cette dette est déjà archivée.');
		}
		const updated = await this.prisma.payableDebt.update({
			where: { id: debtId },
			data: { archivedAt: new Date() },
			include: { creditor: true, payments: true },
		});
		this.realtime.emit(orgId, 'payables', 'updated', String(debtId), {
			number: updated.label,
			status: updated.status,
		});
		return { success: true, archivedAt: updated.archivedAt?.toISOString() };
	}

	async restoreDebt(organizationId: number | undefined, debtId: number) {
		const orgId = this.assertOrg(organizationId);
		const debt = await this.prisma.payableDebt.findFirst({
			where: { id: debtId, organizationId: orgId },
		});
		if (!debt) throw new NotFoundException('Dette introuvable');
		if (!debt.archivedAt) {
			throw new BadRequestException('Cette dette n’est pas archivée.');
		}
		await this.prisma.payableDebt.update({
			where: { id: debtId },
			data: { archivedAt: null },
		});
		this.realtime.emit(orgId, 'payables', 'updated', String(debtId), {
			number: debt.label,
			status: debt.status,
		});
		return { success: true };
	}

	async findArchivedGrouped(organizationId: number | undefined) {
		const orgId = this.assertOrg(organizationId);
		const items = await this.prisma.payableDebt.findMany({
			where: { organizationId: orgId, archivedAt: { not: null } },
			orderBy: { createdAt: 'desc' },
			include: { creditor: true, payments: true },
		});
		const rows = items.map((d) => this.mapDebt(d));
		return {
			groups: groupByYearAndMonth(rows, (d) => d.createdAt),
			total: rows.length,
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

		const paymentDate = dto.date ? new Date(dto.date) : new Date();
		const payment = await this.prisma.payableDebtPayment.create({
			data: {
				debtId,
				amount,
				date: paymentDate,
				method: dto.method?.trim() || null,
				notes: dto.notes?.trim() || null,
			},
		});

		await this.postPurchaseOnRecognition(debtId, paymentDate);
		try {
			await this.accounting.postPayableDebtPayment({
				debtId,
				paymentId: payment.id,
				amount,
				date: paymentDate,
			});
		} catch (err) {
			this.logger.warn(`Compta paiement dette ${debtId}#${payment.id}: ${(err as Error).message}`);
		}

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
			include: { payments: true },
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

		const remaining = Number(debt.balance);
		try {
			if (debt.payments.length === 0) {
				await this.accounting.contraPayableDebtPurchase(debtId);
			} else if (remaining > BALANCE_EPSILON) {
				await this.postPurchaseOnRecognition(debtId);
				await this.accounting.postPayableDebtCancelRemaining(debtId, remaining);
			}
		} catch (err) {
			this.logger.warn(`Compta annulation dette ${debtId}: ${(err as Error).message}`);
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
			where: { organizationId: orgId, archivedAt: null, status: { not: 'CANCELLED' } },
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
