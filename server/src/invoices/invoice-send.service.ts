import { BadRequestException, Injectable } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendInvoiceDto } from './dto/send-invoice.dto';

@Injectable()
export class InvoiceSendService {
	constructor(
		private readonly invoices: InvoicesService,
		private readonly pdfService: PdfService,
		private readonly email: EmailService,
		private readonly organizations: OrganizationsService,
		private readonly prisma: PrismaService,
	) {}

	async sendByEmail(id: string, organizationId: number, dto?: SendInvoiceDto) {
		const result = await this.invoices.sendInvoice(id, organizationId);
		let invoice = await this.invoices.findOne(id, organizationId);

		const overrideEmail = dto?.email?.trim();
		if (overrideEmail) {
			if (dto?.updateClientEmail !== false) {
				await this.prisma.client.update({
					where: { id: invoice.clientId },
					data: { email: overrideEmail },
				});
			}
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
		const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
		const trackOpenUrl = result.publicToken
			? `${apiUrl}/api/track/opened/invoice/${result.publicToken}`
			: undefined;

		const isPaid =
			result.status === 'PAID' || Number(result.balance) <= 0 || Number(invoice.balance) <= 0;
		const publicViewUrl = result.publicToken
			? InvoicesService.buildPublicPaymentUrl(result.publicToken)
			: undefined;

		await this.email.sendInvoice({
			to,
			invoiceNumber: invoice.number,
			invoiceDate: invoice.date,
			clientName:
				(invoice.client as any)?.name || (invoice.client as any)?.companyName || '',
			total: Number(invoice.total),
			pdfBuffer: pdf,
			trackOpenUrl,
			paymentUrl: isPaid ? undefined : publicViewUrl,
			alreadyPaid: isPaid,
			invoiceViewUrl: isPaid ? publicViewUrl : undefined,
		});

		return {
			id: result.id,
			number: result.number,
			status: result.status,
			publicToken: result.publicToken,
			publicUrl: (result as any).publicUrl,
			sentAt: result.sentAt,
			emailSent: true,
			sentTo: to,
			alreadyPaid: isPaid,
		};
	}
}
