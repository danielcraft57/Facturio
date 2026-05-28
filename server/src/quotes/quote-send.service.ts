import { BadRequestException, Injectable } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PdfService } from '../common/pdf.service';
import { EmailService } from '../common/email.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentEmailCopiesService } from '../common/document-email-copies.service';
import type { SendDocumentEmailDto } from '../common/dto/send-document-email.dto';

@Injectable()
export class QuoteSendService {
	constructor(
		private readonly quotes: QuotesService,
		private readonly pdfService: PdfService,
		private readonly email: EmailService,
		private readonly organizations: OrganizationsService,
		private readonly prisma: PrismaService,
		private readonly documentCopies: DocumentEmailCopiesService,
	) {}

	async sendByEmail(
		id: string,
		organizationId: number,
		dto?: SendDocumentEmailDto,
		senderEmail?: string | null,
	) {
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
			const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
			const baseUrl = process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
			const trackOpenUrl = `${apiUrl}/api/track/opened/quote/${token}`;
			const acceptUrl = `${baseUrl}/public/devis/${token}/accepter`;
			const rejectUrl = `${baseUrl}/public/devis/${token}/refuser`;
			await this.email.sendQuote({
				to,
				quoteNumber: result.number,
				quoteDate: result.createdAt,
				clientName: result.client.name || result.client.companyName || '',
				total: Number(result.total),
				expiryDate: result.expiryDate || undefined,
				pdfBuffer: pdf,
				trackOpenUrl,
				acceptUrl,
				rejectUrl,
			});
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
		});

		return {
			...result,
			emailSent,
			sentTo: to,
			copiesSent,
		};
	}
}
