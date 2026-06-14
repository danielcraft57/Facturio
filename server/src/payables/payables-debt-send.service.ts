import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DocumentEmailCopiesService } from '../common/document-email-copies.service';
import { EmailService } from '../common/email.service';
import type { SendDocumentEmailDto } from '../common/dto/send-document-email.dto';
import type { SendPayableDebtPaymentNoticeDto } from './dto/send-payable-debt-payment-notice.dto';
import { computeDebtBalance } from './payables-balance.util';
import { recordPayableDebtEmailSent } from '../common/email-engagement.util';
import {
	buildEmailClickTrackUrl,
	buildEmailOpenTrackUrl,
} from '../common/email-track.util';
import { OrganizationsService } from '../organizations/organizations.service';
import { PayablesService } from './payables.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';
import { resolveEmailIssuerDisplayName } from '../common/email-legal-footer';
import { buildPublicPayableDebtUrl } from '../common/public-app-url';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class PayablesDebtSendService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailService,
		private readonly organizations: OrganizationsService,
		private readonly realtime: RealtimeEventsService,
		private readonly documentCopies: DocumentEmailCopiesService,
		private readonly payables: PayablesService,
		private readonly billing: BillingService,
	) {}

	async ensurePublicToken(debtId: number, organizationId: number): Promise<string> {
		const debt = await this.prisma.payableDebt.findFirst({
			where: { id: debtId, organizationId },
			select: { publicToken: true },
		});
		if (!debt) throw new NotFoundException('Dette introuvable');
		if (debt.publicToken) return debt.publicToken;
		const token = randomBytes(32).toString('hex');
		await this.prisma.payableDebt.update({
			where: { id: debtId },
			data: { publicToken: token },
		});
		return token;
	}

	async sendByEmail(
		debtId: number,
		organizationId: number | undefined,
		dto?: SendDocumentEmailDto,
		senderEmail?: string | null,
	) {
		if (organizationId == null) throw new BadRequestException('Organisation requise');
		await this.billing.assertCanSendDocumentEmail(organizationId);

		const debt = await this.prisma.payableDebt.findFirst({
			where: { id: debtId, organizationId },
			include: { creditor: true },
		});
		if (!debt) throw new NotFoundException('Dette introuvable');

		const overrideEmail = (dto?.email ?? dto?.to)?.trim();
		const existingEmail = debt.creditor.email?.trim();
		if (overrideEmail && dto?.updateClientEmail !== false && !existingEmail) {
			await this.prisma.payableCreditor.update({
				where: { id: debt.creditorId },
				data: { email: overrideEmail },
			});
			debt.creditor.email = overrideEmail;
		}

		const to = overrideEmail || existingEmail;
		if (!to) {
			throw new BadRequestException(
				'Adresse email requise : renseignez-la à l’envoi ou sur la fiche créancier.',
			);
		}

		const publicToken = await this.ensurePublicToken(debtId, organizationId);
		const trackOpenUrl = buildEmailOpenTrackUrl('payable_debt', publicToken);
		const viewUrl = buildEmailClickTrackUrl('payable_debt', publicToken, 'view');

		const organization = await this.organizations.getProfile(organizationId).catch(() => undefined);
		const issuerName = resolveEmailIssuerDisplayName(organization);

		await this.email.sendPayableDebt({
			to,
			creditorName: debt.creditor.name,
			label: debt.label,
			totalAmount: Number(debt.totalAmount),
			balance: Number(debt.balance),
			dueDate: debt.dueDate,
			notes: debt.notes,
			issuerName,
			trackOpenUrl,
			viewUrl,
			organization,
		});

		await recordPayableDebtEmailSent(this.prisma, debt.id);
		const sentAt = new Date();
		await this.prisma.payableDebt.update({
			where: { id: debtId },
			data: { sentAt },
		});
		await this.payables.postPurchaseOnRecognition(debtId, sentAt);

		const copyRecipients = this.documentCopies.buildCopyRecipients(dto, to, senderEmail);
		for (const copyTo of copyRecipients) {
			await this.email.sendPayableDebt({
				to: copyTo,
				creditorName: debt.creditor.name,
				label: debt.label,
				totalAmount: Number(debt.totalAmount),
				balance: Number(debt.balance),
				dueDate: debt.dueDate,
				notes: debt.notes,
				issuerName,
				organization,
			});
		}

		this.realtime.emit(organizationId, 'payables', 'sent', String(debt.id), {
			number: debt.label,
			status: 'EMAIL_SENT',
		});

		return {
			success: true,
			emailSent: true,
			sentTo: to,
			debtId: debt.id,
			publicToken,
			url: buildPublicPayableDebtUrl(publicToken),
			copiesSent: copyRecipients,
		};
	}

	async sendPaymentNoticeByEmail(
		debtId: number,
		organizationId: number | undefined,
		dto: SendPayableDebtPaymentNoticeDto,
		senderEmail?: string | null,
	) {
		if (organizationId == null) throw new BadRequestException('Organisation requise');
		await this.billing.assertCanSendDocumentEmail(organizationId);

		const paymentAmount = Number(dto.paymentAmount.toFixed(2));
		if (paymentAmount <= 0) {
			throw new BadRequestException('Montant du remboursement invalide.');
		}

		const debt = await this.prisma.payableDebt.findFirst({
			where: { id: debtId, organizationId },
			include: { creditor: true, payments: true },
		});
		if (!debt) throw new NotFoundException('Dette introuvable');
		if (debt.status === 'CANCELLED') {
			throw new BadRequestException('Impossible de notifier le créancier pour une dette annulée.');
		}

		const totalAmount = Number(debt.totalAmount);
		const paymentAmounts = debt.payments.map((p) => Number(p.amount));
		const { totalPaid } = computeDebtBalance(totalAmount, paymentAmounts);
		const balance = Number(debt.balance);
		const fullyPaid = debt.status === 'PAID' || balance <= 0.01;

		const overrideEmail = (dto.email ?? dto.to)?.trim();
		const existingEmail = debt.creditor.email?.trim();
		if (overrideEmail && dto.updateClientEmail !== false && !existingEmail) {
			await this.prisma.payableCreditor.update({
				where: { id: debt.creditorId },
				data: { email: overrideEmail },
			});
			debt.creditor.email = overrideEmail;
		}

		const to = overrideEmail || existingEmail;
		if (!to) {
			throw new BadRequestException(
				'Adresse email requise : renseignez-la à l’envoi ou sur la fiche créancier.',
			);
		}

		const publicToken = await this.ensurePublicToken(debtId, organizationId);
		const trackOpenUrl = buildEmailOpenTrackUrl('payable_debt', publicToken);
		const viewUrl = buildEmailClickTrackUrl('payable_debt', publicToken, 'view');

		const organization = await this.organizations.getProfile(organizationId).catch(() => undefined);
		const issuerName = resolveEmailIssuerDisplayName(organization);

		await this.email.sendPayableDebtPayment({
			to,
			creditorName: debt.creditor.name,
			label: debt.label,
			paymentAmount,
			totalAmount,
			totalPaid,
			balance,
			fullyPaid,
			issuerName,
			trackOpenUrl,
			viewUrl,
			organization,
		});

		const copyRecipients = this.documentCopies.buildCopyRecipients(dto, to, senderEmail);
		for (const copyTo of copyRecipients) {
			await this.email.sendPayableDebtPayment({
				to: copyTo,
				creditorName: debt.creditor.name,
				label: debt.label,
				paymentAmount,
				totalAmount,
				totalPaid,
				balance,
				fullyPaid,
				issuerName,
				organization,
			});
		}

		this.realtime.emit(organizationId, 'payables', 'updated', String(debt.id), {
			number: debt.label,
			status: debt.status,
		});

		return {
			success: true,
			emailSent: true,
			sentTo: to,
			debtId: debt.id,
			publicToken,
			url: buildPublicPayableDebtUrl(publicToken),
			copiesSent: copyRecipients,
			fullyPaid,
		};
	}
}
