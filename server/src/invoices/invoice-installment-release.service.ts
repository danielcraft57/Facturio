import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { InvoiceInstallmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { PdfService } from '../common/pdf.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { ConfigService } from '../config/config.service';
import { buildEmailClickTrackUrl, buildEmailOpenTrackUrl } from '../common/email-track.util';
import { parseTagsJson } from '../common/document-folder.util';
import {
	canReleaseInstallment,
	shouldAutoReleaseScheduledInstallment,
} from './invoice-installment-status.util';
import { daysUntilInstallmentDue } from './invoice-installment-reminder.util';

const ISSUE_EVENT_TYPE = 'installment_issue';

/**
 * Active les mensualités programmées (SCHEDULED → PENDING) et envoie l'email d'émission.
 */
@Injectable()
export class InvoiceInstallmentReleaseService {
	private readonly logger = new Logger(InvoiceInstallmentReleaseService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailService,
		private readonly pdf: PdfService,
		private readonly organizations: OrganizationsService,
		private readonly config: ConfigService,
	) {}

	/**
	 * Cron : active les échéances SCHEDULED dont la date entre dans la fenêtre J-N.
	 *
	 * @returns Nombre d'emails d'émission envoyés
	 */
	async processScheduledReleases(): Promise<number> {
		if (!this.config.installmentAutoReleaseEnabled) return 0;

		const rows = await this.prisma.invoiceInstallment.findMany({
			where: {
				status: 'SCHEDULED' as InvoiceInstallmentStatus,
				invoice: {
					status: { in: ['SENT', 'OVERDUE', 'DRAFT'] },
					balance: { gt: 0 },
				},
			},
			include: {
				invoice: {
					include: {
						installments: { orderBy: { sequence: 'asc' } },
						client: true,
					},
				},
			},
			orderBy: [{ dueDate: 'asc' }, { sequence: 'asc' }],
		});

		let sent = 0;
		const remindDays = this.config.installmentReminderDaysBefore;
		for (const row of rows) {
			if (!shouldAutoReleaseScheduledInstallment(row.dueDate, remindDays)) continue;
			if (
				!canReleaseInstallment(row, row.invoice.installments, row.invoice.tags)
			) {
				continue;
			}
			const already = await this.hasIssueToday(row.id);
			if (already) continue;

			const ok = await this.releaseInstallment(row.id, { force: false });
			if (ok) sent += 1;
		}
		return sent;
	}

	/**
	 * Active une échéance SCHEDULED et envoie l'email au client.
	 *
	 * @param installmentId - ID de la ligne d'échéancier
	 * @param options - force : ignore la fenêtre cron ; skipEmail : activation silencieuse (checkout)
	 */
	async releaseInstallment(
		installmentId: number,
		options: { force?: boolean; skipEmail?: boolean; organizationId?: number },
	): Promise<boolean> {
		const row = await this.prisma.invoiceInstallment.findUnique({
			where: { id: installmentId },
			include: {
				invoice: {
					include: {
						client: true,
						installments: { orderBy: { sequence: 'asc' } },
					},
				},
			},
		});
		if (!row || row.status !== 'SCHEDULED') return false;

		const invoice = row.invoice;
		if (options.organizationId != null && invoice.organizationId !== options.organizationId) {
			return false;
		}
		if (!canReleaseInstallment(row, invoice.installments, invoice.tags)) {
			return false;
		}
		if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
			return false;
		}
		if (Number(invoice.balance) <= 0.01) return false;

		if (!options.force) {
			const remindDays = this.config.installmentReminderDaysBefore;
			if (!shouldAutoReleaseScheduledInstallment(row.dueDate, remindDays)) {
				return false;
			}
		}

		const clientEmail = invoice.client?.email?.trim();
		if (!options.skipEmail && !clientEmail) return false;

		let token = invoice.publicToken;
		if (!token) {
			token = randomBytes(32).toString('hex');
			await this.prisma.invoice.update({
				where: { id: invoice.id },
				data: { publicToken: token },
			});
		}

		await this.prisma.invoiceInstallment.update({
			where: { id: installmentId },
			data: { status: 'PENDING' },
		});

		const tags = parseTagsJson(invoice.tags);
		if (tags.includes('PENDING_EMIT')) {
			await this.prisma.invoice.update({
				where: { id: invoice.id },
				data: {
					status: invoice.sentAt ? invoice.status : 'SENT',
					sentAt: invoice.sentAt ?? new Date(),
					tags: JSON.stringify(tags.filter((t) => t !== 'PENDING_EMIT')),
				},
			});
		}

		await this.prisma.invoice.update({
			where: { id: invoice.id },
			data: { dueDate: row.dueDate },
		});

		const fullInvoice = await this.prisma.invoice.findUnique({
			where: { id: invoice.id },
			include: {
				lines: true,
				client: true,
				appliedAvoirs: true,
				installments: { orderBy: { sequence: 'asc' } },
			},
		});
		if (!fullInvoice) return false;

		if (!options.skipEmail && clientEmail) {
			const orgId = invoice.organizationId;
			const organization = orgId
				? await this.organizations.getProfile(orgId).catch(() => undefined)
				: undefined;

			const pdfBuffer = await this.pdf.generateInvoicePdf(fullInvoice, organization);
			const paymentUrl = buildEmailClickTrackUrl('invoice', token, 'pay');
			const trackOpenUrl = buildEmailOpenTrackUrl('invoice', token);
			const daysUntil = daysUntilInstallmentDue(row.dueDate);

			await this.email.sendInstallmentReminder({
				to: clientEmail,
				clientName: invoice.client?.name || invoice.client?.companyName || '',
				invoiceNumber: invoice.number,
				invoiceDate: invoice.date,
				installmentSequence: row.sequence,
				installmentAmount: Number(row.amount),
				installmentDueDate: row.dueDate,
				invoiceBalance: Number(invoice.balance),
				daysUntilDue: daysUntil,
				kind: 'issue',
				paymentUrl,
				trackOpenUrl,
				pdfBuffer,
				organization,
			});

			await this.prisma.emailEvent.create({
				data: {
					invoiceId: invoice.id,
					type: ISSUE_EVENT_TYPE,
					meta: {
						installmentId: row.id,
						sequence: row.sequence,
					},
				},
			});
		}

		return true;
	}

	/**
	 * Active la prochaine mensualité SCHEDULED si aucune PENDING (page paiement / envoi facture).
	 *
	 * @param invoiceId - ID facture ECH
	 */
	async ensurePayableInstallment(invoiceId: string): Promise<boolean> {
		const pending = await this.prisma.invoiceInstallment.findFirst({
			where: { invoiceId, status: 'PENDING' },
		});
		if (pending) return true;

		const invoice = await this.prisma.invoice.findUnique({
			where: { id: invoiceId },
			include: { installments: { orderBy: { sequence: 'asc' } } },
		});
		if (!invoice?.installments?.length) return false;

		const candidate = invoice.installments.find(
			(r) =>
				r.status === 'SCHEDULED' &&
				canReleaseInstallment(r, invoice.installments, invoice.tags),
		);
		if (!candidate) return false;

		return this.releaseInstallment(candidate.id, { force: true, skipEmail: true });
	}

	private async hasIssueToday(installmentId: number): Promise<boolean> {
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		const events = await this.prisma.emailEvent.findMany({
			where: {
				type: ISSUE_EVENT_TYPE,
				createdAt: { gte: start },
			},
			select: { meta: true },
			take: 200,
		});
		return events.some((e) => {
			const meta = e.meta as { installmentId?: number } | null;
			return meta?.installmentId === installmentId;
		});
	}
}
