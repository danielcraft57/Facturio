import { Injectable } from '@nestjs/common';
import { EmailService, type EmailOrganizationProfile } from './email.service';
import { parseEmailList } from './parse-email-list';
import type { SendDocumentEmailDto } from './dto/send-document-email.dto';

@Injectable()
export class DocumentEmailCopiesService {
	constructor(private readonly email: EmailService) {}

	buildCopyRecipients(
		dto: SendDocumentEmailDto | undefined,
		primaryTo: string,
		senderEmail?: string | null,
	): string[] {
		const seen = new Set<string>();
		const out: string[] = [];
		const add = (email: string) => {
			const trimmed = email.trim();
			if (!trimmed) return;
			const key = trimmed.toLowerCase();
			if (seen.has(key)) return;
			seen.add(key);
			out.push(trimmed);
		};

		const wantSelf = dto?.copyToSelf !== false;
		if (wantSelf && senderEmail?.trim()) {
			// Copie prestataire : même si identique à l’email client (2e mail informatif).
			add(senderEmail.trim());
		}

		const primaryKey = primaryTo?.trim().toLowerCase();
		for (const email of parseEmailList(dto?.additionalRecipients)) {
			if (primaryKey && email.toLowerCase() === primaryKey) continue;
			add(email);
		}
		return out;
	}

	async sendInvoiceCopies(options: {
		recipients: string[];
		invoiceNumber: string;
		invoiceDate: Date | string;
		clientName: string;
		total: number;
		pdfBuffer: Buffer;
		extraAttachments?: { filename: string; content: Buffer; contentType?: string }[];
		organization?: EmailOrganizationProfile;
	}): Promise<string[]> {
		const sent: string[] = [];
		for (const to of options.recipients) {
			await this.email.sendInvoice({
				to,
				invoiceNumber: options.invoiceNumber,
				invoiceDate: options.invoiceDate,
				clientName: options.clientName,
				total: options.total,
				pdfBuffer: options.pdfBuffer,
				extraAttachments: options.extraAttachments,
				informativeCopy: true,
				organization: options.organization,
			});
			sent.push(to);
		}
		return sent;
	}

	async sendQuoteCopies(options: {
		recipients: string[];
		quoteNumber: string;
		quoteDate: Date | string;
		clientName: string;
		total: number;
		expiryDate?: Date | string;
		pdfBuffer: Buffer;
		organization?: EmailOrganizationProfile;
	}): Promise<string[]> {
		const sent: string[] = [];
		for (const to of options.recipients) {
			await this.email.sendQuote({
				to,
				quoteNumber: options.quoteNumber,
				quoteDate: options.quoteDate,
				clientName: options.clientName,
				total: options.total,
				expiryDate: options.expiryDate,
				pdfBuffer: options.pdfBuffer,
				informativeCopy: true,
				organization: options.organization,
			});
			sent.push(to);
		}
		return sent;
	}
}
