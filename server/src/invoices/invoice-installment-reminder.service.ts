import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { PdfService } from '../common/pdf.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { ConfigService } from '../config/config.service';
import {
	daysUntilInstallmentDue,
	resolveInstallmentReminderKind,
} from './invoice-installment-reminder.util';
import { buildEmailClickTrackUrl, buildEmailOpenTrackUrl } from '../common/email-track.util';
const REMINDER_EVENT_TYPE = 'installment_reminder';

/**
 * Relances automatiques des échéances de paiement métier (cron quotidien + envoi manuel).
 */
@Injectable()
export class InvoiceInstallmentReminderService {
	private readonly logger = new Logger(InvoiceInstallmentReminderService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailService,
		private readonly pdf: PdfService,
		private readonly organizations: OrganizationsService,
		private readonly config: ConfigService,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_8AM)
	async runScheduledReminders(): Promise<void> {
		if (!this.config.installmentRemindersEnabled) return;
		try {
			const sent = await this.processDueReminders();
			if (sent > 0) {
				this.logger.log(`Relances échéances : ${sent} email(s) envoyé(s)`);
			}
		} catch (err) {
			this.logger.warn(`Relances échéances échouées : ${(err as Error).message}`);
		}
	}

	/**
	 * Parcourt les échéances en attente et envoie les relances éligibles.
	 *
	 * @returns Nombre d'emails envoyés
	 */
	async processDueReminders(): Promise<number> {
		const rows = await this.prisma.invoiceInstallment.findMany({
			where: {
				status: 'PENDING',
				invoice: {
					sentAt: { not: null },
					status: { in: ['SENT', 'OVERDUE'] },
					balance: { gt: 0 },
				},
			},
			include: {
				invoice: {
					include: {
						client: true,
						organization: { select: { id: true } },
					},
				},
			},
			orderBy: [{ dueDate: 'asc' }],
		});

		let sent = 0;
		const now = new Date();
		for (const row of rows) {
			const daysUntil = daysUntilInstallmentDue(row.dueDate, now);
			const kind = resolveInstallmentReminderKind(daysUntil, {
				remindDaysBefore: this.config.installmentReminderDaysBefore,
				overdueIntervalDays: this.config.installmentReminderOverdueIntervalDays,
			});
			if (!kind) continue;

			const already = await this.hasReminderToday(row.id, kind);
			if (already) continue;

			const ok = await this.sendReminderForInstallment(row.id, { kind, force: false });
			if (ok) sent += 1;
		}
		return sent;
	}

	/**
	 * Envoie une relance pour une échéance précise (action manuelle ou cron).
	 *
	 * @param installmentId - ID échéance
	 * @param options - Type de relance et mode forcé (ignore fenêtre cron)
	 */
	async sendReminderForInstallment(
		installmentId: number,
		options: { kind?: 'upcoming' | 'overdue' | 'manual'; force?: boolean; organizationId?: number },
	): Promise<boolean> {
		const row = await this.prisma.invoiceInstallment.findUnique({
			where: { id: installmentId },
			include: {
				invoice: {
					include: { client: true },
				},
			},
		});
		if (!row || row.status !== 'PENDING') return false;

		const invoice = row.invoice;
		if (options.organizationId != null && invoice.organizationId !== options.organizationId) {
			return false;
		}
		if (!invoice.sentAt || invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
			return false;
		}
		if (Number(invoice.balance) <= 0.01) return false;

		const clientEmail = invoice.client?.email?.trim();
		if (!clientEmail) return false;

		const token = invoice.publicToken;
		if (!token) return false;

		const daysUntil = daysUntilInstallmentDue(row.dueDate);
		let kind = options.kind ?? 'manual';
		if (!options.force && kind === 'manual') {
			const autoKind = resolveInstallmentReminderKind(daysUntil, {
				remindDaysBefore: this.config.installmentReminderDaysBefore,
				overdueIntervalDays: this.config.installmentReminderOverdueIntervalDays,
			});
			kind = autoKind ?? (daysUntil < 0 ? 'overdue' : 'upcoming');
		}

		const orgId = invoice.organizationId;
		const organization = orgId
			? await this.organizations.getProfile(orgId).catch(() => undefined)
			: undefined;

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

		const pdfBuffer = await this.pdf.generateInvoicePdf(fullInvoice, organization);
		const paymentUrl = buildEmailClickTrackUrl('invoice', token, 'pay');
		const trackOpenUrl = buildEmailOpenTrackUrl('invoice', token);
		const daysOverdue = daysUntil < 0 ? Math.abs(daysUntil) : undefined;

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
			daysOverdue,
			kind,
			paymentUrl,
			trackOpenUrl,
			pdfBuffer,
			organization,
		});

		await this.prisma.emailEvent.create({
			data: {
				invoiceId: invoice.id,
				type: REMINDER_EVENT_TYPE,
				meta: {
					installmentId: row.id,
					kind,
					sequence: row.sequence,
				},
			},
		});

		return true;
	}

	private async hasReminderToday(
		installmentId: number,
		kind: string,
	): Promise<boolean> {
		const start = new Date();
		start.setHours(0, 0, 0, 0);
		const events = await this.prisma.emailEvent.findMany({
			where: {
				type: REMINDER_EVENT_TYPE,
				createdAt: { gte: start },
			},
			select: { meta: true },
			take: 200,
		});
		return events.some((e) => {
			const meta = e.meta as { installmentId?: number; kind?: string } | null;
			return meta?.installmentId === installmentId && meta?.kind === kind;
		});
	}
}
