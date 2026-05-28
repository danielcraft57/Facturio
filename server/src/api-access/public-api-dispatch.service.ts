import { Injectable } from '@nestjs/common';
import { InvoiceSendService } from '../invoices/invoice-send.service';
import { SendInvoiceDto } from '../invoices/dto/send-invoice.dto';
import { QuoteSendService } from '../quotes/quote-send.service';

/** Envoi email facture / devis (même logique que les controllers internes). */
@Injectable()
export class PublicApiDispatchService {
	constructor(
		private readonly invoiceSend: InvoiceSendService,
		private readonly quoteSend: QuoteSendService,
	) {}

	async sendInvoiceByEmail(id: string, organizationId: number, dto?: SendInvoiceDto) {
		return this.invoiceSend.sendByEmail(id, organizationId, dto);
	}

	async sendQuoteByEmail(id: string, organizationId: number, dto?: SendInvoiceDto) {
		const result = await this.quoteSend.sendByEmail(id, organizationId, dto);
		return {
			id: result.id,
			number: result.number,
			status: result.status,
			publicToken: result.publicToken,
			sentAt: result.sentAt,
			emailSent: result.emailSent,
			sentTo: result.sentTo,
			copiesSent: result.copiesSent,
		};
	}
}
