import { BadRequestException, Injectable } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendInvoiceDto } from './dto/send-invoice.dto';
import { DocumentEmailCopiesService } from '../common/document-email-copies.service';
import { parseTagsJson } from '../common/document-folder.util';
import { buildEmailClickTrackUrl, buildEmailOpenTrackUrl } from '../common/email-track.util';
import { recordInvoiceEmailSent } from '../common/email-engagement.util';
import { BillingService } from '../billing/billing.service';
import { InvoiceInstallmentReleaseService } from './invoice-installment-release.service';

@Injectable()
export class InvoiceSendService {
	constructor(
		private readonly invoices: InvoicesService,
		private readonly pdfService: PdfService,
		private readonly email: EmailService,
		private readonly organizations: OrganizationsService,
		private readonly prisma: PrismaService,
		private readonly documentCopies: DocumentEmailCopiesService,
		private readonly billing: BillingService,
		private readonly installmentReleases: InvoiceInstallmentReleaseService,
	) {}

	async sendByEmail(
		id: string,
		organizationId: number,
		dto?: SendInvoiceDto,
		senderEmail?: string | null,
	) {
		await this.billing.assertCanSendDocumentEmail(organizationId);
		const result = await this.invoices.sendInvoice(id, organizationId);
		await this.installmentReleases.ensurePayableInstallment(id);
		let invoice = await this.invoices.findOne(id, organizationId);

		const overrideEmail = (dto?.email ?? dto?.to)?.trim();
		const existingClientEmail = (invoice.client as { email?: string | null })?.email?.trim();
		if (overrideEmail && dto?.updateClientEmail !== false && !existingClientEmail) {
			await this.prisma.client.update({
				where: { id: invoice.clientId },
				data: { email: overrideEmail },
			});
			invoice = await this.invoices.findOne(id, organizationId);
		}

		const to = overrideEmail || (invoice.client as { email?: string | null })?.email?.trim();
		if (!to) {
			throw new BadRequestException(
				'Adresse email requise : renseignez-la à l’envoi ou sur la fiche client.',
			);
		}

		const organization = await this.organizations.getProfile(organizationId).catch(() => undefined);
		const pdf = await this.pdfService.generateInvoicePdf(invoice, organization);
		const tags = parseTagsJson(invoice.tags);
		const isDeposit = tags.includes('ACOMPTE_10');
		const extraAttachments: { filename: string; content: Buffer; contentType?: string }[] = [];
		if (isDeposit) {
			try {
				const contractPdf = await this.pdfService.generateEngagementContractPdf(invoice, organization);
				extraAttachments.push({
					filename: `contrat-prestation-${invoice.number}.pdf`,
					content: contractPdf,
					contentType: 'application/pdf',
				});
			} catch {
				// La facture d'acompte reste envoyée même si le contrat n'a pas pu être généré.
			}
		}
		const token = result.publicToken;
		const trackOpenUrl = token ? buildEmailOpenTrackUrl('invoice', token) : undefined;

		const isPaid =
			result.status === 'PAID' || Number(result.balance) <= 0 || Number(invoice.balance) <= 0;
		const publicViewUrl = token ? InvoicesService.buildPublicPaymentUrl(token) : undefined;
		const orgProfile = organization as
			| {
					invoiceStripeSecretKeySet?: boolean;
					invoiceStripePublishableKeyPreview?: string | null;
					invoiceStripePublishableKey?: string | null;
			  }
			| undefined;
		const canPayOnline =
			!isPaid &&
			Boolean(
				orgProfile?.invoiceStripeSecretKeySet === true &&
					((orgProfile?.invoiceStripePublishableKeyPreview ?? '').trim() ||
						(orgProfile?.invoiceStripePublishableKey ?? '').trim()),
			);

		const clientName =
			(invoice.client as { name?: string; companyName?: string })?.name ||
			(invoice.client as { companyName?: string })?.companyName ||
			'';

		const nextInstallment =
			invoice.installments?.find(
				(row: { status: string }) => row.status === 'PENDING',
			) ?? null;
		const installmentContext =
			nextInstallment && (invoice.installments?.length ?? 0) > 0
				? {
						sequence: nextInstallment.sequence,
						totalCount: invoice.installments!.length,
						amountDue: Number(nextInstallment.amount),
						balanceRemaining: Number(invoice.balance),
						dueDate: nextInstallment.dueDate,
						contractTotal: Number(invoice.total),
					}
				: undefined;

		await this.email.sendInvoice({
			to,
			invoiceNumber: invoice.number,
			invoiceDate: invoice.date,
			clientName,
			total: installmentContext?.amountDue ?? Number(invoice.total),
			installmentContext,
			pdfBuffer: pdf,
			extraAttachments,
			trackOpenUrl,
			paymentUrl: canPayOnline && token ? buildEmailClickTrackUrl('invoice', token, 'pay') : undefined,
			alreadyPaid: isPaid,
			invoiceViewUrl:
				!isPaid && !canPayOnline && token
					? buildEmailClickTrackUrl('invoice', token, 'view')
					: isPaid && token
						? buildEmailClickTrackUrl('invoice', token, 'view')
						: undefined,
			organization,
		});
		await recordInvoiceEmailSent(this.prisma, id);

		const copyRecipients = this.documentCopies.buildCopyRecipients(dto, to, senderEmail);
		const copiesSent = await this.documentCopies.sendInvoiceCopies({
			recipients: copyRecipients,
			invoiceNumber: invoice.number,
			invoiceDate: invoice.date,
			clientName,
			total: installmentContext?.amountDue ?? Number(invoice.total),
			pdfBuffer: pdf,
			extraAttachments,
			organization,
		});

		return {
			id: result.id,
			number: result.number,
			status: result.status,
			publicToken: result.publicToken,
			publicUrl: (result as { publicUrl?: string }).publicUrl,
			sentAt: result.sentAt,
			emailSent: true,
			sentTo: to,
			alreadyPaid: isPaid,
			copiesSent,
		};
	}
}
