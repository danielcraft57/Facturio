const PDFDocument = require('pdfkit');
import { Injectable, Logger } from '@nestjs/common';
import { PdfDocumentBuilder, resolveCompanyInfo } from './pdf/pdf-document.builder';

/**
 * Génération PDF factures et devis — template corporate (bleu marine / rouge).
 */
@Injectable()
export class PdfService {
	private readonly logger = new Logger(PdfService.name);
	private readonly builder = new PdfDocumentBuilder({
		warn: (msg, err) => this.logger.warn(msg, err)
	});

	generateInvoicePdf(invoice: any, organization?: any): Promise<Buffer> {
		return this.generatePdf({
			kind: 'facture',
			number: invoice.number,
			date: invoice.date || invoice.createdAt,
			document: invoice,
			client: invoice.client,
			lines: invoice.lines || [],
			totals: {
				subtotal: invoice.subtotal || 0,
				tax: invoice.tax || 0,
				total: invoice.total || 0
			},
			organization,
			pdfTitle: `Facture ${invoice.number}`
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
