const PDFDocument = require('pdfkit');
import { Injectable, Logger } from '@nestjs/common';

/**
 * Service de génération PDF pour factures et devis
 * 
 * Génère des PDFs professionnels avec :
 * - En-tête avec logo (optionnel)
 * - Informations entreprise
 * - Détails client
 * - Tableau des lignes formaté
 * - Totaux et mentions légales
 * - Pied de page
 */
@Injectable()
export class PdfService {
	private readonly logger = new Logger(PdfService.name);

	/**
	 * Génère un PDF de facture professionnel
	 */
	generateInvoicePdf(invoice: any): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({ 
					size: 'A4', 
					margin: 50,
					info: {
						Title: `Facture ${invoice.number}`,
						Author: 'Facturio',
						Subject: `Facture ${invoice.number}`
					}
				});
				const chunks: Buffer[] = [];
				doc.on('data', (c: Buffer) => chunks.push(c));
				doc.on('end', () => resolve(Buffer.concat(chunks)));
				doc.on('error', (err) => {
					this.logger.error('Erreur génération PDF', err);
					reject(err);
				});
				this.buildInvoice(doc, invoice);
			} catch (error) {
				this.logger.error('Erreur lors de la création du PDF', error);
				reject(error);
			}
		});
	}

	/**
	 * Génère un PDF de devis professionnel
	 */
	generateQuotePdf(quote: any): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			try {
				const doc = new PDFDocument({ 
					size: 'A4', 
					margin: 50,
					info: {
						Title: `Devis ${quote.number}`,
						Author: 'Facturio',
						Subject: `Devis ${quote.number}`
					}
				});
				const chunks: Buffer[] = [];
				doc.on('data', (c: Buffer) => chunks.push(c));
				doc.on('end', () => resolve(Buffer.concat(chunks)));
				doc.on('error', (err) => {
					this.logger.error('Erreur génération PDF', err);
					reject(err);
				});
				this.buildQuote(doc, quote);
			} catch (error) {
				this.logger.error('Erreur lors de la création du PDF', error);
				reject(error);
			}
		});
	}

	/**
	 * Construit le contenu d'une facture PDF
	 */
	private buildInvoice(doc: any, invoice: any): void {
		// En-tête
		this.buildHeader(doc, `FACTURE ${invoice.number}`, invoice.issueDate || invoice.createdAt);
		
		// Informations entreprise (à configurer via variables d'environnement)
		this.buildCompanyInfo(doc);
		
		doc.moveDown(1);
		
		// Informations client
		this.buildClientInfo(doc, invoice.client);
		
		doc.moveDown(1);
		
		// Tableau des lignes
		this.buildLinesTable(doc, invoice.lines || []);
		
		doc.moveDown(1);
		
		// Totaux
		this.buildTotals(doc, {
			subtotal: invoice.subtotal || 0,
			tax: invoice.tax || 0,
			total: invoice.total || 0
		});
		
		doc.moveDown(2);
		
		// Mentions légales
		this.buildLegalMentions(doc, 'facture');
		
		// Pied de page
		this.buildFooter(doc);
		
		doc.end();
	}

	/**
	 * Construit le contenu d'un devis PDF
	 */
	private buildQuote(doc: any, quote: any): void {
		// En-tête
		this.buildHeader(doc, `DEVIS ${quote.number}`, quote.createdAt);
		
		// Informations entreprise
		this.buildCompanyInfo(doc);
		
		doc.moveDown(1);
		
		// Informations client
		this.buildClientInfo(doc, quote.client);
		
		doc.moveDown(1);
		
		// Date de validité si présente
		if (quote.expiryDate) {
			doc.fontSize(10)
				.fillColor('#666666')
				.text(`Valable jusqu'au ${new Date(quote.expiryDate).toLocaleDateString('fr-FR')}`, { align: 'right' });
			doc.moveDown(0.5);
		}
		
		// Tableau des lignes
		this.buildLinesTable(doc, quote.lines || []);
		
		doc.moveDown(1);
		
		// Totaux
		this.buildTotals(doc, {
			subtotal: quote.subtotal || 0,
			tax: quote.tax || 0,
			total: quote.total || 0
		});
		
		doc.moveDown(2);
		
		// Mentions légales
		this.buildLegalMentions(doc, 'devis');
		
		// Pied de page
		this.buildFooter(doc);
		
		doc.end();
	}

	/**
	 * Construit l'en-tête du document
	 */
	private buildHeader(doc: any, title: string, date?: Date | string): void {
		doc.fontSize(24)
			.fillColor('#000000')
			.font('Helvetica-Bold')
			.text(title, { align: 'right' });
		
		if (date) {
			doc.fontSize(10)
				.fillColor('#666666')
				.font('Helvetica')
				.text(`Date: ${new Date(date).toLocaleDateString('fr-FR')}`, { align: 'right' });
		}
		
		doc.moveDown(1);
		doc.strokeColor('#cccccc')
			.lineWidth(1)
			.moveTo(50, doc.y)
			.lineTo(545, doc.y)
			.stroke();
		doc.moveDown(1);
	}

	/**
	 * Construit les informations entreprise
	 */
	private buildCompanyInfo(doc: any): void {
		const companyName = process.env.COMPANY_NAME || 'Votre Entreprise';
		const companyAddress = process.env.COMPANY_ADDRESS || 'Adresse de votre entreprise';
		const companySiret = process.env.COMPANY_SIRET || '';
		const companyTva = process.env.COMPANY_VAT || '';
		
		doc.fontSize(12)
			.fillColor('#000000')
			.font('Helvetica-Bold')
			.text(companyName);
		
		doc.fontSize(10)
			.fillColor('#333333')
			.font('Helvetica')
			.text(companyAddress);
		
		if (companySiret) {
			doc.text(`SIRET: ${companySiret}`);
		}
		if (companyTva) {
			doc.text(`TVA: ${companyTva}`);
		}
	}

	/**
	 * Construit les informations client
	 */
	private buildClientInfo(doc: any, client: any): void {
		if (!client) return;
		
		doc.fontSize(10)
			.fillColor('#666666')
			.text('Facturé à:', { continued: false });
		
		doc.fontSize(11)
			.fillColor('#000000')
			.font('Helvetica-Bold')
			.text(client.name || client.companyName || '');
		
		if (client.address) {
			doc.fontSize(10)
				.fillColor('#333333')
				.font('Helvetica')
				.text(client.address);
		}
		
		if (client.email) {
			doc.text(client.email);
		}
		
		if (client.vatNumber) {
			doc.text(`TVA: ${client.vatNumber}`);
		}
	}

	/**
	 * Construit le tableau des lignes
	 */
	private buildLinesTable(doc: any, lines: any[]): void {
		if (lines.length === 0) return;
		
		const tableTop = doc.y;
		const itemHeight = 30;
		const tableWidth = 495;
		
		// En-tête du tableau
		doc.fontSize(10)
			.fillColor('#ffffff')
			.font('Helvetica-Bold')
			.rect(50, tableTop, tableWidth, 25)
			.fill('#333333')
			.fillColor('#ffffff')
			.text('Description', 55, tableTop + 8)
			.text('Qté', 300, tableTop + 8)
			.text('Prix unit.', 350, tableTop + 8)
			.text('TVA', 420, tableTop + 8)
			.text('Total', 450, tableTop + 8);
		
		// Lignes
		let y = tableTop + 25;
		doc.fillColor('#000000')
			.font('Helvetica');
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const lineY = y + (i * itemHeight);
			
			// Fond alterné
			if (i % 2 === 0) {
				doc.rect(50, lineY, tableWidth, itemHeight)
					.fillColor('#f9f9f9')
					.fill()
					.fillColor('#000000');
			}
			
			// Contenu
			doc.fontSize(9)
				.text(line.description || '', 55, lineY + 10, { width: 240 })
				.text(String(line.quantity || 0), 300, lineY + 10)
				.text(`${this.formatCurrency(line.unitPrice || 0)}`, 350, lineY + 10)
				.text(`${(line.taxRate || 0) * 100}%`, 420, lineY + 10)
				.text(this.formatCurrency(line.total || 0), 450, lineY + 10);
		}
		
		// Bordure du tableau
		doc.strokeColor('#cccccc')
			.lineWidth(1)
			.rect(50, tableTop, tableWidth, (lines.length * itemHeight) + 25)
			.stroke();
		
		doc.y = tableTop + (lines.length * itemHeight) + 30;
	}

	/**
	 * Construit la section des totaux
	 */
	private buildTotals(doc: any, totals: { subtotal: number; tax: number; total: number }): void {
		const startY = doc.y;
		const rightMargin = 545;
		const lineHeight = 20;
		
		doc.fontSize(10)
			.fillColor('#333333');
		
		doc.text('Sous-total HT:', rightMargin - 150, startY, { width: 100, align: 'right' })
			.text(this.formatCurrency(totals.subtotal), rightMargin - 50, startY, { align: 'right' });
		
		doc.text('TVA:', rightMargin - 150, startY + lineHeight, { width: 100, align: 'right' })
			.text(this.formatCurrency(totals.tax), rightMargin - 50, startY + lineHeight, { align: 'right' });
		
		doc.fontSize(12)
			.fillColor('#000000')
			.font('Helvetica-Bold')
			.text('Total TTC:', rightMargin - 150, startY + (lineHeight * 2), { width: 100, align: 'right' })
			.text(this.formatCurrency(totals.total), rightMargin - 50, startY + (lineHeight * 2), { align: 'right' });
		
		doc.y = startY + (lineHeight * 3) + 10;
	}

	/**
	 * Construit les mentions légales
	 */
	private buildLegalMentions(doc: any, type: 'facture' | 'devis'): void {
		const mentions = process.env.LEGAL_MENTIONS || '';
		
		if (mentions) {
			doc.fontSize(8)
				.fillColor('#666666')
				.font('Helvetica')
				.text(mentions, { align: 'justify' });
		} else {
			// Mentions par défaut
			doc.fontSize(8)
				.fillColor('#666666')
				.font('Helvetica')
				.text(
					type === 'facture' 
						? 'Facture établie conformément aux dispositions légales en vigueur.'
						: 'Devis valable 30 jours. Acceptation par signature ou bon de commande.',
					{ align: 'justify' }
				);
		}
	}

	/**
	 * Construit le pied de page
	 */
	private buildFooter(doc: any): void {
		const pageHeight = doc.page.height;
		const footerY = pageHeight - 50;
		
		doc.fontSize(8)
			.fillColor('#999999')
			.font('Helvetica')
			.text(
				`Page ${doc.page.number} - Généré par Facturio`,
				50,
				footerY,
				{ align: 'center', width: 495 }
			);
	}

	/**
	 * Formate un montant en devise
	 */
	private formatCurrency(amount: number): string {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: 'EUR'
		}).format(amount);
	}
}
