import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailService } from '../common/email.service';
import { buildEmailClickTrackUrl, buildEmailOpenTrackUrl } from '../common/email-track.util';
import { PdfService } from '../common/pdf.service';
import { InvoicesService } from '../invoices/invoices.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import {
	RECEIVABLE_AUTO_REMIND_MIN_DAYS_PAST_DUE,
	RECEIVABLE_REMIND_COOLDOWN_DAYS,
} from '../invoices/invoice-due-date.util';
import { daysPastDue } from './receivables-aging.util';

export type ReceivableRemindResult = {
	sent: number;
	skipped: number;
	errors: string[];
};

@Injectable()
export class ReceivablesReminderService {
	private readonly logger = new Logger(ReceivablesReminderService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly invoices: InvoicesService,
		private readonly email: EmailService,
		private readonly pdf: PdfService,
		private readonly organizations: OrganizationsService,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_8AM)
	async runDailyAutoReminders(): Promise<void> {
		const orgs = await this.prisma.organization.findMany({ select: { id: true } });
		let totalSent = 0;
		for (const org of orgs) {
			try {
				const result = await this.remindOverdueForOrganization(org.id, {
					invoiceIds: undefined,
					autoOnly: true,
				});
				totalSent += result.sent;
			} catch (err) {
				this.logger.warn(`Relances auto org ${org.id}: ${err instanceof Error ? err.message : err}`);
			}
		}
		if (totalSent > 0) {
			this.logger.log(`Relances automatiques : ${totalSent} email(s) envoyé(s)`);
		}
	}

	async remindOverdueForOrganization(
		organizationId: number,
		opts?: { invoiceIds?: string[]; autoOnly?: boolean },
	): Promise<ReceivableRemindResult> {
		const cooldownMs = RECEIVABLE_REMIND_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
		const cooldownSince = new Date(Date.now() - cooldownMs);

		const candidates = await this.prisma.invoice.findMany({
			where: {
				organizationId,
				archivedAt: null,
				status: { notIn: ['DRAFT', 'CANCELLED', 'PAID'] },
				sentAt: { not: null },
				balance: { gt: 0.01 },
				...(opts?.invoiceIds?.length ? { id: { in: opts.invoiceIds } } : {}),
			},
			include: {
				client: { select: { email: true, name: true, companyName: true } },
			},
		});

		const organization = await this.organizations.getProfile(organizationId).catch(() => undefined);
		let sent = 0;
		let skipped = 0;
		const errors: string[] = [];

		for (const inv of candidates) {
			const referenceDate = inv.dueDate ?? inv.date;
			const pastDue = daysPastDue(referenceDate);
			if (pastDue < RECEIVABLE_AUTO_REMIND_MIN_DAYS_PAST_DUE) {
				skipped += 1;
				continue;
			}

			const lastReminder = await this.prisma.emailEvent.findFirst({
				where: { invoiceId: inv.id, type: 'reminder' },
				orderBy: { createdAt: 'desc' },
			});
			if (lastReminder && lastReminder.createdAt > cooldownSince) {
				skipped += 1;
				continue;
			}

			const email = inv.client?.email;
			if (!email) {
				skipped += 1;
				errors.push(`${inv.number}: client sans email`);
				continue;
			}

			try {
				const { invoice, daysOverdue, publicUrl } = await this.invoices.prepareReminder(
					inv.id,
					organizationId,
				);
				const pdfBuffer = await this.pdf.generateInvoicePdf(invoice, organization);
				const token = invoice.publicToken;
				const trackOpenUrl = token ? buildEmailOpenTrackUrl('invoice', token) : undefined;
				const paymentUrl = token
					? buildEmailClickTrackUrl('invoice', token, 'pay')
					: publicUrl;
				const client = invoice.client as { email?: string; name?: string; companyName?: string };

				await this.email.sendReminder({
					to: client.email!,
					invoiceNumber: invoice.number,
					invoiceDate: invoice.date,
					clientName: client.name || client.companyName || '',
					amount: Number(invoice.total),
					daysOverdue,
					paymentUrl,
					trackOpenUrl,
					pdfBuffer,
					organization,
				});
				sent += 1;
			} catch (err) {
				errors.push(
					`${inv.number}: ${err instanceof Error ? err.message : 'erreur relance'}`,
				);
			}
		}

		return { sent, skipped, errors };
	}
}
