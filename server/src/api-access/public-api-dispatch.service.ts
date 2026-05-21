import { Injectable } from '@nestjs/common';
import { InvoiceSendService } from '../invoices/invoice-send.service';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { QuotesService } from '../quotes/quotes.service';
import { SendInvoiceDto } from '../invoices/dto/send-invoice.dto';

/** Envoi email facture / devis (même logique que les controllers internes). */
@Injectable()
export class PublicApiDispatchService {
	constructor(
		private readonly invoiceSend: InvoiceSendService,
		private readonly quotes: QuotesService,
		private readonly pdfService: PdfService,
		private readonly email: EmailService,
		private readonly organizations: OrganizationsService,
	) {}

	async sendInvoiceByEmail(id: number, organizationId: number, dto?: SendInvoiceDto) {
		return this.invoiceSend.sendByEmail(id, organizationId, dto);
	}

	async sendQuoteByEmail(id: number, organizationId: number) {
		const result = await this.quotes.sendQuote(id, organizationId);
		const token = result.publicToken;
		const organization = await this.organizations.getProfile(organizationId).catch(() => undefined);
		const pdf = await this.pdfService.generateQuotePdf(result, organization);
		if (result.client?.email && token) {
			const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
			const baseUrl = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
			const trackOpenUrl = `${apiUrl}/api/track/opened/quote/${token}`;
			const acceptUrl = `${baseUrl}/public/devis/${token}/accepter`;
			const rejectUrl = `${baseUrl}/public/devis/${token}/refuser`;
			await this.email.sendQuote({
				to: result.client.email,
				quoteNumber: result.number,
				quoteDate: result.date,
				clientName: (result.client as any).name || (result.client as any).companyName || '',
				total: Number(result.total),
				pdfBuffer: pdf,
				trackOpenUrl,
				acceptUrl,
				rejectUrl,
			});
		}
		return {
			id: result.id,
			number: result.number,
			status: result.status,
			publicToken: token,
			sentAt: result.sentAt,
			emailSent: !!result.client?.email,
		};
	}
}
