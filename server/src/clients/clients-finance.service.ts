import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AvoirsService } from '../avoirs/avoirs.service';
import { InvoicesService } from '../invoices/invoices.service';
import type { ClientFinanceQueryDto } from './dto/client-finance-query.dto';
import type { CreateClientMiscOperationDto } from './dto/create-client-misc-operation.dto';
import type { CreateClientCreditDto } from './dto/create-client-credit.dto';

export type ClientMovementKind =
	| 'invoice'
	| 'payment'
	| 'refund'
	| 'credit_note'
	| 'credit_applied'
	| 'misc'
	| 'quote';

export type ClientMovement = {
	id: string;
	kind: ClientMovementKind;
	date: string;
	label: string;
	reference?: string;
	amount: number;
	direction: 'in' | 'out' | 'neutral';
	invoiceId?: string;
	avoirId?: number;
	quoteId?: string;
	meta?: Record<string, unknown>;
};

export type ClientFinanceBalances = {
	totalInvoicedTtc: number;
	totalPaidNet: number;
	totalRefunded: number;
	totalCreditsAvailable: number;
	totalCreditsApplied: number;
	outstandingBalance: number;
};

export type ClientFinanceTaxes = {
	vatCollected: number;
	vatCredited: number;
	netVat: number;
	revenueHt: number;
};

export type ClientFinanceAvoirSummary = {
	id: number;
	number: string;
	date: string;
	status: string;
	total: number;
	appliedAmount: number;
	balance: number;
	isMisc: boolean;
	invoiceId?: string | null;
};

export type ClientFinanceResponse = {
	balances: ClientFinanceBalances;
	taxes: ClientFinanceTaxes;
	movements: ClientMovement[];
	avoirs: ClientFinanceAvoirSummary[];
	invoiceCount: number;
	quoteCount: number;
	openInvoices: Array<{
		id: string;
		number: string;
		total: number;
		balance: number;
		status: string;
		date: string;
	}>;
};

const MISC_PREFIX = 'OP_DIVERSE:';

@Injectable()
export class ClientsFinanceService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly avoirs: AvoirsService,
		private readonly invoices: InvoicesService,
	) {}

	private async assertClient(clientId: string, organizationId?: number) {
		const client = await this.prisma.client.findFirst({
			where: {
				id: clientId,
				...(organizationId != null ? { organizationId } : {}),
			},
		});
		if (!client) throw new NotFoundException('Client introuvable');
		return client;
	}

	private inDateRange(date: Date, start?: Date, end?: Date): boolean {
		if (start && date < start) return false;
		if (end && date > end) return false;
		return true;
	}

	async getFinance(
		clientId: string,
		organizationId: number | undefined,
		query?: ClientFinanceQueryDto,
	): Promise<ClientFinanceResponse> {
		const client = await this.assertClient(clientId, organizationId);
		const orgId = organizationId ?? client.organizationId ?? undefined;
		if (!orgId) throw new BadRequestException('Organisation requise');

		const start = query?.start ? new Date(query.start) : undefined;
		const end = query?.end ? new Date(query.end) : undefined;

		const invoiceWhere = {
			clientId,
			organizationId: orgId,
			archivedAt: null,
			status: { not: 'CANCELLED' as const },
		};

		const invoices = await this.prisma.invoice.findMany({
			where: invoiceWhere,
			include: {
				payments: true,
				refunds: { where: { status: 'COMPLETED' } },
				appliedAvoirs: true,
			},
			orderBy: { date: 'desc' },
		});

		for (const inv of invoices) {
			await this.invoices.syncInvoiceFinancials(inv.id, { organizationId: orgId });
		}

		const refreshedInvoices = await this.prisma.invoice.findMany({
			where: invoiceWhere,
			orderBy: { date: 'desc' },
		});

		const payments = await this.prisma.payment.findMany({
			where: { invoice: { clientId, organizationId: orgId } },
			include: { invoice: { select: { number: true } } },
			orderBy: { date: 'desc' },
		});

		const refunds = await this.prisma.refund.findMany({
			where: {
				status: 'COMPLETED',
				invoice: { clientId, organizationId: orgId },
			},
			include: { invoice: { select: { number: true } } },
			orderBy: { createdAt: 'desc' },
		});

		const avoirs = await this.prisma.avoir.findMany({
			where: { clientId, organizationId: orgId, status: { not: 'CANCELLED' } },
			include: { applications: { include: { invoice: { select: { number: true } } } } },
			orderBy: { date: 'desc' },
		});

		const applications = await this.prisma.avoirApplication.findMany({
			where: { invoice: { clientId, organizationId: orgId } },
			include: {
				avoir: { select: { number: true } },
				invoice: { select: { number: true, id: true } },
			},
			orderBy: { appliedAt: 'desc' },
		});

		const quotes = await this.prisma.quote.findMany({
			where: { clientId, organizationId: orgId, archivedAt: null },
			orderBy: { date: 'desc' },
			take: 50,
		});

		let totalInvoicedTtc = 0;
		let outstandingBalance = 0;
		let vatCollected = 0;
		let revenueHt = 0;

		const openInvoices: ClientFinanceResponse['openInvoices'] = [];

		for (const inv of refreshedInvoices) {
			const total = Number(inv.total);
			const balance = Number(inv.balance ?? 0);
			const tax = Number(inv.tax ?? 0);
			const subtotal = Number(inv.subtotal ?? 0);
			totalInvoicedTtc += total;
			outstandingBalance += balance;
			if (inv.status === 'PAID' || balance <= 0.01) {
				vatCollected += tax;
				revenueHt += subtotal;
			}
			if (balance > 0.01 && inv.status !== 'DRAFT') {
				openInvoices.push({
					id: inv.id,
					number: inv.number,
					total,
					balance,
					status: inv.status,
					date: inv.date.toISOString(),
				});
			}
		}

		const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
		const totalRefunded = refunds.reduce((s, r) => s + Number(r.amount), 0);
		const totalPaidNet = Number((totalPaid - totalRefunded).toFixed(2));
		const totalCreditsApplied = applications.reduce((s, a) => s + Number(a.amount), 0);

		let totalCreditsAvailable = 0;
		let vatCredited = 0;
		const avoirSummaries: ClientFinanceAvoirSummary[] = [];

		for (const a of avoirs) {
			const total = Number(a.total);
			const applied = Number(a.appliedAmount ?? 0);
			const balance = Number((total - applied).toFixed(2));
			const isMisc = (a.legalMention ?? '').startsWith(MISC_PREFIX);
			if (['SENT', 'APPLIED'].includes(a.status) && !a.invoiceId && balance > 0.01) {
				totalCreditsAvailable += balance;
			}
			if (['SENT', 'APPLIED'].includes(a.status)) {
				vatCredited += Number(a.tax ?? 0);
			}
			avoirSummaries.push({
				id: a.id,
				number: a.number,
				date: a.date.toISOString(),
				status: a.status,
				total,
				appliedAmount: applied,
				balance,
				isMisc,
				invoiceId: a.invoiceId,
			});
		}

		const movements: ClientMovement[] = [];

		for (const inv of refreshedInvoices) {
			const d = inv.date;
			if (!this.inDateRange(d, start, end)) continue;
			movements.push({
				id: `inv-${inv.id}`,
				kind: 'invoice',
				date: d.toISOString(),
				label: `Facture ${inv.number}`,
				reference: inv.number,
				amount: Number(inv.total),
				direction: 'in',
				invoiceId: inv.id,
			});
		}

		for (const p of payments) {
			const d = p.date;
			if (!this.inDateRange(d, start, end)) continue;
			movements.push({
				id: `pay-${p.id}`,
				kind: 'payment',
				date: d.toISOString(),
				label: `Paiement — ${p.invoice.number}`,
				reference: p.invoice.number,
				amount: Number(p.amount),
				direction: 'in',
				invoiceId: p.invoiceId,
			});
		}

		for (const r of refunds) {
			const d = r.createdAt;
			if (!this.inDateRange(d, start, end)) continue;
			movements.push({
				id: `ref-${r.id}`,
				kind: 'refund',
				date: d.toISOString(),
				label: `Remboursement — ${r.invoice.number}`,
				reference: r.invoice.number,
				amount: Number(r.amount),
				direction: 'out',
				invoiceId: r.invoiceId,
			});
		}

		for (const a of avoirs) {
			const d = a.date;
			if (!this.inDateRange(d, start, end)) continue;
			const isMisc = (a.legalMention ?? '').startsWith(MISC_PREFIX);
			movements.push({
				id: `avoir-${a.id}`,
				kind: isMisc ? 'misc' : 'credit_note',
				date: d.toISOString(),
				label: isMisc
					? `Opération diverse — ${a.number}`
					: `Avoir ${a.number}`,
				reference: a.number,
				amount: Number(a.total),
				direction: 'out',
				avoirId: a.id,
				invoiceId: a.invoiceId ?? undefined,
			});
		}

		for (const app of applications) {
			const d = app.appliedAt;
			if (!this.inDateRange(d, start, end)) continue;
			movements.push({
				id: `app-${app.id}`,
				kind: 'credit_applied',
				date: d.toISOString(),
				label: `Imputation ${app.avoir.number} → ${app.invoice.number}`,
				reference: app.avoir.number,
				amount: Number(app.amount),
				direction: 'neutral',
				avoirId: app.avoirId,
				invoiceId: app.invoiceId,
			});
		}

		for (const q of quotes) {
			const d = q.date;
			if (!this.inDateRange(d, start, end)) continue;
			movements.push({
				id: `quote-${q.id}`,
				kind: 'quote',
				date: d.toISOString(),
				label: `Devis ${q.number}`,
				reference: q.number,
				amount: Number(q.total),
				direction: 'neutral',
				quoteId: q.id,
			});
		}

		movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		return {
			invoiceCount: refreshedInvoices.length,
			quoteCount: quotes.length,
			balances: {
				totalInvoicedTtc: Number(totalInvoicedTtc.toFixed(2)),
				totalPaidNet,
				totalRefunded: Number(totalRefunded.toFixed(2)),
				totalCreditsAvailable: Number(totalCreditsAvailable.toFixed(2)),
				totalCreditsApplied: Number(totalCreditsApplied.toFixed(2)),
				outstandingBalance: Number(outstandingBalance.toFixed(2)),
			},
			taxes: {
				vatCollected: Number(vatCollected.toFixed(2)),
				vatCredited: Number(vatCredited.toFixed(2)),
				netVat: Number((vatCollected - vatCredited).toFixed(2)),
				revenueHt: Number(revenueHt.toFixed(2)),
			},
			movements,
			avoirs: avoirSummaries,
			openInvoices,
		};
	}

	async createMiscOperation(
		clientId: string,
		dto: CreateClientMiscOperationDto,
		organizationId?: number,
	) {
		await this.assertClient(clientId, organizationId);
		const defaultTaxRate = 0.2;
		const subtotalHt = Number((dto.amountTtc / (1 + defaultTaxRate)).toFixed(2));
		const mention = `${MISC_PREFIX}${dto.kind ?? 'other'}${dto.notes ? `|${dto.notes}` : ''}`;

		return this.avoirs.create(
			{
				clientId,
				status: 'SENT',
				memo: mention,
				lines: [
					{
						description: dto.label,
						quantity: 1,
						unitPrice: subtotalHt,
						taxRate: defaultTaxRate,
					},
				],
			},
			organizationId,
		);
	}

	async createClientCredit(
		clientId: string,
		dto: CreateClientCreditDto,
		organizationId?: number,
	) {
		await this.assertClient(clientId, organizationId);
		const defaultTaxRate = 0.2;
		const subtotalHt = Number((dto.amountTtc / (1 + defaultTaxRate)).toFixed(2));
		const memo = dto.notes
			? `Crédit client — ${dto.label} (${dto.notes})`
			: `Crédit client — ${dto.label}`;

		return this.avoirs.create(
			{
				clientId,
				status: 'SENT',
				memo,
				lines: [
					{
						description: dto.label,
						quantity: 1,
						unitPrice: subtotalHt,
						taxRate: defaultTaxRate,
					},
				],
			},
			organizationId,
		);
	}
}
