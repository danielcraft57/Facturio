import { BadRequestException, Injectable } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentEmailCopiesService } from '../common/document-email-copies.service';
import type { SendDocumentEmailDto } from '../common/dto/send-document-email.dto';
import { buildEmailClickTrackUrl, buildEmailOpenTrackUrl } from '../common/email-track.util';
import { recordQuoteEmailSent } from '../common/email-engagement.util';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class QuoteSendService {
	constructor(
		private readonly quotes: QuotesService,
		private readonly pdfService: PdfService,
		private readonly email: EmailService,
		private readonly organizations: OrganizationsService,
		private readonly prisma: PrismaService,
		private readonly documentCopies: DocumentEmailCopiesService,
		private readonly billing: BillingService,
	) {}

	async sendByEmail(
		id: string,
		organizationId: number,
		dto?: SendDocumentEmailDto,
		senderEmail?: string | null,
	) {
		await this.billing.assertCanSendDocumentEmail(organizationId);
		const result = await this.quotes.sendQuote(id, organizationId);
		const token = result.publicToken;
		const organization = await this.organizations.getProfile(organizationId).catch(() => undefined);
		const pdf = await this.pdfService.generateQuotePdf(result, organization);

		const overrideEmail = (dto?.email ?? dto?.to)?.trim();
		const existingClientEmail = result.client?.email?.trim();
		if (overrideEmail && dto?.updateClientEmail !== false && !existingClientEmail) {
			await this.prisma.client.update({
				where: { id: result.clientId },
				data: { email: overrideEmail },
			});
		}

		const to = overrideEmail || result.client?.email?.trim();
		if (!to) {
			throw new BadRequestException(
				'Adresse email requise : renseignez-la à l’envoi ou sur la fiche client.',
			);
		}

		let emailSent = false;
		if (token) {
			const trackOpenUrl = buildEmailOpenTrackUrl('quote', token);
			await this.email.sendQuote({
				to,
				quoteNumber: result.number,
				quoteDate: result.createdAt,
				clientName: result.client.name || result.client.companyName || '',
				total: Number(result.total),
				expiryDate: result.expiryDate || undefined,
				pdfBuffer: pdf,
				trackOpenUrl,
				acceptUrl: buildEmailClickTrackUrl('quote', token, 'accept'),
				rejectUrl: buildEmailClickTrackUrl('quote', token, 'reject'),
				organization,
			});
			await recordQuoteEmailSent(this.prisma, id);
			emailSent = true;
		}

		const copyRecipients = this.documentCopies.buildCopyRecipients(dto, to, senderEmail);
		const copiesSent = await this.documentCopies.sendQuoteCopies({
			recipients: copyRecipients,
			quoteNumber: result.number,
			quoteDate: result.createdAt,
			clientName: result.client.name || result.client.companyName || '',
			total: Number(result.total),
			expiryDate: result.expiryDate || undefined,
			pdfBuffer: pdf,
			organization,
		});

		return {
			...result,
			emailSent,
			sentTo: to,
			copiesSent,
		};
	}
}
