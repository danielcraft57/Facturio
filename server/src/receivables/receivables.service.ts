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

export type ReceivablesResponse = {
	summary: {
		totalOutstanding: number;
		clientCount: number;
		invoiceCount: number;
		aging: ReceivableAgingTotals;
	};
	clients: ReceivableClientRow[];
	invoices: ReceivableInvoiceRow[];
};

const BALANCE_EPSILON = 0.01;

@Injectable()
export class ReceivablesService {
	constructor(private readonly prisma: PrismaService) {}

	async getReceivables(organizationId: number | undefined, query?: ReceivablesQueryDto): Promise<ReceivablesResponse> {
		if (organizationId == null) throw new BadRequestException('Organisation requise');

		const start = query?.start ? new Date(query.start) : undefined;
		const end = query?.end ? new Date(query.end) : undefined;

		const invoices = await this.prisma.invoice.findMany({
			where: {
				organizationId,
				archivedAt: null,
				status: { notIn: ['DRAFT', 'CANCELLED'] },
				...(start || end
					? {
							date: {
								...(start ? { gte: start } : {}),
								...(end ? { lte: end } : {}),
							},
						}
					: {}),
			},
			include: {
				client: { select: { id: true, name: true, email: true } },
			},
			orderBy: [{ dueDate: 'asc' }, { date: 'desc' }],
		});

		const summaryAging: ReceivableAgingTotals = { ...EMPTY_AGING_TOTALS };
		const openRows: ReceivableInvoiceRow[] = [];
		const clientMap = new Map<string, ReceivableClientRow>();

		for (const inv of invoices) {
			const balance = Number(inv.balance ?? 0);
			if (balance <= BALANCE_EPSILON) continue;

			const referenceDate = inv.dueDate ?? inv.date;
			const bucket = receivableAgingBucket(referenceDate);
			const pastDue = daysPastDue(referenceDate);

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
			};
			openRows.push(row);

			addToAgingTotals(summaryAging, bucket, balance);

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

		return {
			summary: {
				totalOutstanding,
				clientCount: clients.length,
				invoiceCount: openRows.length,
				aging: summaryAging,
			},
			clients,
			invoices: openRows,
		};
	}
}
