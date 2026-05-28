import { BadRequestException, Injectable } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendInvoiceDto } from './dto/send-invoice.dto';
import { DocumentEmailCopiesService } from '../common/document-email-copies.service';
import { parseTagsJson } from '../common/document-folder.util';

@Injectable()
export class InvoiceSendService {
	constructor(
		private readonly invoices: InvoicesService,
		private readonly pdfService: PdfService,
		private readonly email: EmailService,
		private readonly organizations: OrganizationsService,
		private readonly prisma: PrismaService,
		private readonly documentCopies: DocumentEmailCopiesService,
	) {}

	async sendByEmail(
		id: string,
		organizationId: number,
		dto?: SendInvoiceDto,
		senderEmail?: string | null,
	) {
		const result = await this.invoices.sendInvoice(id, organizationId);
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
		const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
		const trackOpenUrl = result.publicToken
			? `${apiUrl}/api/track/opened/invoice/${result.publicToken}`
			: undefined;

		const isPaid =
			result.status === 'PAID' || Number(result.balance) <= 0 || Number(invoice.balance) <= 0;
		const publicViewUrl = result.publicToken
			? InvoicesService.buildPublicPaymentUrl(result.publicToken)
			: undefined;

		const clientName =
			(invoice.client as { name?: string; companyName?: string })?.name ||
			(invoice.client as { companyName?: string })?.companyName ||
			'';

		await this.email.sendInvoice({
			to,
			invoiceNumber: invoice.number,
			invoiceDate: invoice.date,
			clientName,
			total: Number(invoice.total),
			pdfBuffer: pdf,
			extraAttachments,
			trackOpenUrl,
			paymentUrl: isPaid ? undefined : publicViewUrl,
			alreadyPaid: isPaid,
			invoiceViewUrl: isPaid ? publicViewUrl : undefined,
		});

		const copyRecipients = this.documentCopies.buildCopyRecipients(dto, to, senderEmail);
		const copiesSent = await this.documentCopies.sendInvoiceCopies({
			recipients: copyRecipients,
			invoiceNumber: invoice.number,
			invoiceDate: invoice.date,
			clientName,
			total: Number(invoice.total),
			pdfBuffer: pdf,
			extraAttachments,
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
