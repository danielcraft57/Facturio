const PDFDocument = require('pdfkit');
import { Injectable, Logger } from '@nestjs/common';
import { PdfDocumentBuilder, resolveCompanyInfo } from './pdf/pdf-document.builder';
import { EngagementContractPdfBuilder } from './pdf/engagement-contract-pdf.builder';
import { parseTagsJson } from './document-folder.util';
import {
	buildDepositPaymentNote,
	buildDepositCommitmentParagraph,
	buildRemainderCommitmentParagraph,
} from '../invoices/invoice-deposit.util';
import { resolveEngagementBreakdownForInvoice } from '../invoices/invoice-engagement-breakdown.util';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Génération PDF factures et devis — template corporate (bleu marine / rouge).
 */
@Injectable()
export class PdfService {
	private readonly logger = new Logger(PdfService.name);
	private readonly builder = new PdfDocumentBuilder({
		warn: (msg, err) => this.logger.warn(msg, err)
	});
	private readonly engagementContractBuilder = new EngagementContractPdfBuilder();

	constructor(private readonly prisma: PrismaService) {}

	private async resolveEngagementBreakdown(invoice: {
		id: string;
		sourceQuoteId: string | null;
		organizationId: number | null;
		tags: string | null;
		total?: unknown;
	}) {
		return resolveEngagementBreakdownForInvoice(this.prisma, invoice);
	}

	async generateInvoicePdf(invoice: any, organization?: any): Promise<Buffer> {
		const tags = parseTagsJson(invoice?.tags ?? null);
		const dueDateFr = invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : null;
		const isDeposit = tags.includes('ACOMPTE_10');
		const isRemainder = tags.includes('SOLDE_APRES_ACOMPTE');
		const engagementBreakdown = await this.resolveEngagementBreakdown(invoice);
		let paymentNote: string | null = null;
		if (isDeposit) {
			paymentNote =
				invoice?.status === 'PAID'
					? 'Paiement acompte reçu — merci pour votre règlement.'
					: buildDepositPaymentNote(dueDateFr);
		} else if (isRemainder) {
			paymentNote =
				invoice?.status === 'PAID'
					? 'Solde reçu — merci, votre devis est entièrement réglé.'
					: dueDateFr
						? `Solde du devis — à régler avant le ${dueDateFr} (paiement en ligne par carte bancaire).`
						: `Solde du devis (paiement en ligne par carte bancaire).`;
		}

		const commitmentParagraph = isDeposit
			? buildDepositCommitmentParagraph(dueDateFr)
			: isRemainder
				? buildRemainderCommitmentParagraph(dueDateFr)
				: null;

		const document = {
			...invoice,
			...(paymentNote ? { paymentNote } : {}),
			...(commitmentParagraph && !invoice.legalMention ? { legalMention: commitmentParagraph } : {}),
			...(engagementBreakdown ? { engagementBreakdown } : {}),
		};

		const pdfTitle = isDeposit
			? `Facture d'acompte ${invoice.number}`
			: isRemainder
				? `Facture de solde ${invoice.number}`
				: `Facture ${invoice.number}`;

		return this.generatePdf({
			kind: 'facture',
			number: invoice.number,
			date: invoice.date || invoice.createdAt,
			document,
			client: invoice.client,
			lines: invoice.lines || [],
			totals: {
				subtotal: invoice.subtotal || 0,
				tax: invoice.tax || 0,
				total: invoice.total || 0
			},
			organization,
			pdfTitle,
		});
	}

	async generateEngagementContractPdf(invoice: any, organization?: any): Promise<Buffer> {
		const tags = parseTagsJson(invoice?.tags ?? null);
		const quoteId =
			invoice?.sourceQuoteId ??
			(() => {
				for (const tag of tags) {
					if (tag.startsWith('ACOMPTE_10_OF:')) return tag.slice('ACOMPTE_10_OF:'.length);
					if (tag.startsWith('SOLDE_APRES_ACOMPTE_OF:')) return tag.slice('SOLDE_APRES_ACOMPTE_OF:'.length);
				}
				return null;
			})();
		if (!quoteId || !invoice?.organizationId) {
			throw new Error("Impossible de générer le contrat d'engagement (devis source introuvable).");
		}
		const [quote, breakdown] = await Promise.all([
			this.prisma.quote.findUnique({
				where: { id: quoteId },
				include: { lines: true, client: true },
			}),
			this.resolveEngagementBreakdown(invoice),
		]);
		if (!quote) {
			throw new Error("Impossible de générer le contrat d'engagement (devis introuvable).");
		}
		if (!breakdown) {
			throw new Error("Impossible de générer le contrat d'engagement (répartition acompte/solde introuvable).");
		}
		const dueDateFr = invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : null;
		const org = organization ?? invoice?.organization ?? null;

		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({
					size: 'A4',
					margins: { top: 50, bottom: 50, left: 50, right: 50 },
					info: {
						Title: `Contrat d'engagement ${quote.number}`,
						Author: 'Facturio',
						Subject: `Contrat d'engagement — devis ${quote.number}`,
					},
				});
				const chunks: Buffer[] = [];
				doc.on('data', (c: Buffer) => chunks.push(c));
				doc.on('end', () => resolve(Buffer.concat(chunks)));
				doc.on('error', reject);

				this.engagementContractBuilder.build(doc, {
					quote,
					client: quote.client,
					organization: org,
					breakdown,
					dueDateFr,
				});
				doc.end();
			} catch (err) {
				reject(err);
			}
		});
	}

	/** Facture d'abonnement Facturio (émetteur = variables .env plateforme). */
	generateSubscriptionInvoicePdf(payload: {
		number: string;
		date: Date | string;
		client: any;
		lines: any[];
		totals: { subtotal: number; tax: number; total: number };
		organization?: any;
		document?: any;
	}): Promise<Buffer> {
		return this.generatePdf({
			kind: 'facture',
			number: payload.number,
			date: payload.date,
			signatureDate: payload.date,
			document: payload.document,
			client: payload.client,
			lines: payload.lines,
			totals: payload.totals,
			organization: payload.organization,
			signature: payload.organization?.signature ?? null,
			pdfTitle: `Facture ${payload.number}`,
		});
	}

	generateQuotePdf(quote: any, organization?: any): Promise<Buffer> {
		return this.generatePdf({
			kind: 'devis',
			number: quote.number,
			date: quote.createdAt,
			document: quote,
			client: quote.client,
			lines: quote.lines || [],
			totals: {
				subtotal: quote.subtotal || 0,
				tax: quote.tax || 0,
				total: quote.total || 0
			},
			organization,
			expiryDate: quote.expiryDate,
			pdfTitle: `Devis ${quote.number}`
		});
	}

	private generatePdf(params: {
		kind: 'facture' | 'devis';
		number: string;
		date?: Date | string;
		document: any;
		client: any;
		lines: any[];
		totals: { subtotal: number; tax: number; total: number };
		organization?: any;
		expiryDate?: Date | string;
		signature?: string | null;
		signatureDate?: Date | string;
		pdfTitle: string;
	}): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({
					size: 'A4',
					margins: { top: 0, bottom: 50, left: 0, right: 0 },
					info: {
						Title: params.pdfTitle,
						Author: 'Facturio',
						Subject: params.pdfTitle
					}
				});
				const chunks: Buffer[] = [];
				doc.on('data', (c: Buffer) => chunks.push(c));
				doc.on('end', () => resolve(Buffer.concat(chunks)));
				doc.on('error', (err: Error) => {
					this.logger.error('Erreur génération PDF', err);
					reject(err);
				});

				this.builder.build(doc, {
					kind: params.kind,
					number: params.number,
					date: params.date,
					company: resolveCompanyInfo(params.organization),
					client: params.client,
					lines: params.lines,
					totals: params.totals,
					organization: params.organization,
					document: params.document,
					expiryDate: params.expiryDate,
					signature: (params as { signature?: string | null }).signature,
					signatureDate: (params as { signatureDate?: Date | string }).signatureDate,
				});

				doc.end();
			} catch (error) {
				this.logger.error('Erreur lors de la création du PDF', error);
				reject(error);
			}
		});
	}
}
