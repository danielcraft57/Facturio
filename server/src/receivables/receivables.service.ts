import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ReceivablesQueryDto } from './dto/receivables-query.dto';
import {
	addToAgingTotals,
	daysPastDue,
	EMPTY_AGING_TOTALS,
	receivableAgingBucket,
	type ReceivableAgingBucket,
	type ReceivableAgingTotals,
} from './receivables-aging.util';
import {
	type ReceivableDocumentKind,
	resolveReceivableDocumentKind,
	resolveReceivableQuoteId,
} from './receivable-document-kind.util';
import { buildReceivableInvoiceWhere } from './receivables-invoice-filter.util';
import { buildInstallmentReceivable } from '../invoices/invoice-installment-finance.util';

export type ReceivableInvoiceRow = {
	id: string;
	number: string;
	clientId: string;
	clientName: string;
	date: string;
	dueDate: string | null;
	total: number;
	balance: number;
	status: string;
	daysPastDue: number;
	agingBucket: ReceivableAgingBucket;
	documentKind: ReceivableDocumentKind;
	quoteId: string | null;
	lastReminderAt: string | null;
};

export type ReceivableClientRow = {
	clientId: string;
	clientName: string;
	clientEmail: string | null;
	totalBalance: number;
	invoiceCount: number;
	maxDaysPastDue: number;
	aging: ReceivableAgingTotals;
};

/** Créance analytique issue d'une échéance de plan de paiement. */
export type ReceivableInstallmentRow = {
	id: number;
	sequence: number;
	invoiceId: string;
	invoiceNumber: string;
	clientId: string;
	clientName: string;
	dueDate: string;
	amount: number;
	daysPastDue: number;
	agingBucket: ReceivableAgingBucket;
	overdue: boolean;
	autoTracked: true;
};

export type ReceivablesByKindTotals = Record<ReceivableDocumentKind, number>;

export type ReceivablesResponse = {
	summary: {
		totalOutstanding: number;
		clientCount: number;
		invoiceCount: number;
		aging: ReceivableAgingTotals;
		byKind: ReceivablesByKindTotals;
		installmentOutstanding: number;
		installmentCount: number;
	};
	clients: ReceivableClientRow[];
	invoices: ReceivableInvoiceRow[];
	installmentReceivables: ReceivableInstallmentRow[];
};

const BALANCE_EPSILON = 0.01;

const EMPTY_BY_KIND: ReceivablesByKindTotals = {
	standard: 0,
	deposit: 0,
	remainder: 0,
};

@Injectable()
export class ReceivablesService {
	constructor(private readonly prisma: PrismaService) {}

	async getReceivables(organizationId: number | undefined, query?: ReceivablesQueryDto): Promise<ReceivablesResponse> {
		if (organizationId == null) throw new BadRequestException('Organisation requise');

		const start = query?.start ? new Date(query.start) : undefined;
		const end = query?.end ? new Date(query.end) : undefined;
		const kindFilter = query?.kind;

		const invoices = await this.prisma.invoice.findMany({
			where: buildReceivableInvoiceWhere(organizationId, { start, end }) as never,
			include: {
				client: { select: { id: true, name: true, email: true } },
			},
			orderBy: [{ dueDate: 'asc' }, { date: 'desc' }],
		});

		const openIds = invoices
			.filter((inv) => Number(inv.balance ?? 0) > BALANCE_EPSILON)
			.map((inv) => inv.id);

		const reminderEvents = openIds.length
			? await this.prisma.emailEvent.findMany({
					where: { invoiceId: { in: openIds }, type: 'reminder' },
					orderBy: { createdAt: 'desc' },
					select: { invoiceId: true, createdAt: true },
				})
			: [];

		const lastReminderByInvoice = new Map<string, Date>();
		for (const ev of reminderEvents) {
			if (!ev.invoiceId || lastReminderByInvoice.has(ev.invoiceId)) continue;
			lastReminderByInvoice.set(ev.invoiceId, ev.createdAt);
		}

		const summaryAging: ReceivableAgingTotals = { ...EMPTY_AGING_TOTALS };
		const byKind: ReceivablesByKindTotals = { ...EMPTY_BY_KIND };
		const openRows: ReceivableInvoiceRow[] = [];
		const clientMap = new Map<string, ReceivableClientRow>();

		for (const inv of invoices) {
			const balance = Number(inv.balance ?? 0);
			if (balance <= BALANCE_EPSILON) continue;

			const documentKind = resolveReceivableDocumentKind(inv.tags);
			if (kindFilter && documentKind !== kindFilter) continue;

			const referenceDate = inv.dueDate ?? inv.date;
			const bucket = receivableAgingBucket(referenceDate);
			const pastDue = daysPastDue(referenceDate);
			const lastReminder = lastReminderByInvoice.get(inv.id);

			const row: ReceivableInvoiceRow = {
				id: inv.id,
				number: inv.number,
				clientId: inv.clientId,
				clientName: inv.client.name,
				date: inv.date.toISOString(),
				dueDate: inv.dueDate?.toISOString() ?? null,
				total: Number(inv.total),
				balance,
				status: inv.status,
				daysPastDue: pastDue,
				agingBucket: bucket,
				documentKind,
				quoteId: resolveReceivableQuoteId(inv.tags, inv.sourceQuoteId),
				lastReminderAt: lastReminder?.toISOString() ?? null,
			};
			openRows.push(row);

			addToAgingTotals(summaryAging, bucket, balance);
			byKind[documentKind] = Number((byKind[documentKind] + balance).toFixed(2));

			let clientRow = clientMap.get(inv.clientId);
			if (!clientRow) {
				clientRow = {
					clientId: inv.clientId,
					clientName: inv.client.name,
					clientEmail: inv.client.email,
					totalBalance: 0,
					invoiceCount: 0,
					maxDaysPastDue: 0,
					aging: { ...EMPTY_AGING_TOTALS },
				};
				clientMap.set(inv.clientId, clientRow);
			}
			clientRow.totalBalance = Number((clientRow.totalBalance + balance).toFixed(2));
			clientRow.invoiceCount += 1;
			clientRow.maxDaysPastDue = Math.max(clientRow.maxDaysPastDue, pastDue);
			addToAgingTotals(clientRow.aging, bucket, balance);
		}

		const totalOutstanding = Number(
			openRows.reduce((sum, r) => sum + r.balance, 0).toFixed(2),
		);

		const clients = [...clientMap.values()].sort((a, b) => b.totalBalance - a.totalBalance);

		const installmentReceivables = await this.loadInstallmentReceivables(
			organizationId,
			start,
			end,
		);
		const installmentOutstanding = Number(
			installmentReceivables.reduce((sum, row) => sum + row.amount, 0).toFixed(2),
		);

		return {
			summary: {
				totalOutstanding,
				clientCount: clients.length,
				invoiceCount: openRows.length,
				aging: summaryAging,
				byKind,
				installmentOutstanding,
				installmentCount: installmentReceivables.length,
			},
			clients,
			invoices: openRows,
			installmentReceivables,
		};
	}

	/**
	 * Créances automatiques par échéance (plans de paiement actifs).
	 *
	 * @param organizationId - Organisation
	 * @param start - Filtre date facture (optionnel)
	 * @param end - Filtre date facture (optionnel)
	 */
	private async loadInstallmentReceivables(
		organizationId: number,
		start?: Date,
		end?: Date,
	): Promise<ReceivableInstallmentRow[]> {
		const invoiceWhere = buildReceivableInvoiceWhere(organizationId, { start, end });
		const rows = await this.prisma.invoiceInstallment.findMany({
			where: {
				status: 'PENDING',
				invoice: invoiceWhere as never,
			},
			include: {
				invoice: {
					select: {
						id: true,
						number: true,
						clientId: true,
						balance: true,
						client: { select: { name: true } },
					},
				},
			},
			orderBy: [{ dueDate: 'asc' }, { sequence: 'asc' }],
		});

		const result: ReceivableInstallmentRow[] = [];
		for (const row of rows) {
			const balance = Number(row.invoice.balance ?? 0);
			if (balance <= BALANCE_EPSILON) continue;

			const receivable = buildInstallmentReceivable(
				row.dueDate,
				Number(row.amount),
				row.status,
			);
			if (!receivable) continue;

			result.push({
				id: row.id,
				sequence: row.sequence,
				invoiceId: row.invoice.id,
				invoiceNumber: row.invoice.number,
				clientId: row.invoice.clientId,
				clientName: row.invoice.client.name,
				dueDate: row.dueDate.toISOString(),
				amount: Number(row.amount),
				daysPastDue: receivable.daysPastDue,
				agingBucket: receivable.agingBucket,
				overdue: receivable.daysPastDue > 0,
				autoTracked: true,
			});
		}
		return result;
	}
}
