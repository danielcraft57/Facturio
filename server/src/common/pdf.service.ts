const PDFDocument = require('pdfkit');
import { Injectable } from '@nestjs/common';

@Injectable()
export class PdfService {
	generateInvoicePdf(invoice: any): Promise<Buffer> {
		return new Promise((resolve) => {
			const doc = new PDFDocument({ size: 'A4', margin: 48 });
			const chunks: Buffer[] = [];
			doc.on('data', (c: Buffer) => chunks.push(c));
			doc.on('end', () => resolve(Buffer.concat(chunks)));
			this.buildInvoice(doc, invoice);
		});
	}

	generateQuotePdf(quote: any): Promise<Buffer> {
		return new Promise((resolve) => {
			const doc = new PDFDocument({ size: 'A4', margin: 48 });
			const chunks: Buffer[] = [];
			doc.on('data', (c: Buffer) => chunks.push(c));
			doc.on('end', () => resolve(Buffer.concat(chunks)));
			this.buildQuote(doc, quote);
		});
	}

	private buildInvoice(doc: any, invoice: any): void {
		doc.fontSize(18).text(`Facture ${invoice.number}`, { align: 'right' });
		doc.moveDown();
		doc.fontSize(12).text(`Client: ${invoice.client?.name || ''}`);
		doc.moveDown();
		doc.text('Lignes:');
		for (const l of invoice.lines || []) {
			doc.text(`- ${l.description} x${l.quantity} @ ${l.unitPrice} => ${l.total}`);
		}
		doc.moveDown();
		doc.text(`Sous-total: ${invoice.subtotal}`);
		doc.text(`TVA: ${invoice.tax}`);
		doc.text(`Total: ${invoice.total}`);
		doc.end();
	}

	private buildQuote(doc: any, quote: any): void {
		doc.fontSize(18).text(`Devis ${quote.number}`, { align: 'right' });
		doc.moveDown();
		doc.fontSize(12).text(`Client: ${quote.client?.name || ''}`);
		doc.moveDown();
		doc.text('Lignes:');
		for (const l of quote.lines || []) {
			doc.text(`- ${l.description} x${l.quantity} @ ${l.unitPrice} => ${l.total}`);
		}
		doc.moveDown();
		doc.text(`Sous-total: ${quote.subtotal}`);
		doc.text(`TVA: ${quote.tax}`);
		doc.text(`Total: ${quote.total}`);
		doc.end();
	}
}
