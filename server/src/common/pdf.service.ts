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
	generateInvoicePdf(invoice: any, organization?: any): Promise<Buffer> {
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
				doc.on('error', (err: Error) => {
					this.logger.error('Erreur génération PDF', err);
					reject(err);
				});
				this.buildInvoice(doc, invoice, organization);
			} catch (error) {
				this.logger.error('Erreur lors de la création du PDF', error);
				reject(error);
			}
		});
	}

	/**
	 * Génère un PDF de devis professionnel
	 */
	generateQuotePdf(quote: any, organization?: any): Promise<Buffer> {
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
				doc.on('error', (err: Error) => {
					this.logger.error('Erreur génération PDF', err);
					reject(err);
				});
				this.buildQuote(doc, quote, organization);
			} catch (error) {
				this.logger.error('Erreur lors de la création du PDF', error);
				reject(error);
			}
		});
	}

	/**
	 * Construit le contenu d'une facture PDF
	 */
	private buildInvoice(doc: any, invoice: any, organization?: any): void {
		// En-tête
		this.buildHeader(doc, `FACTURE ${invoice.number}`, invoice.date || invoice.createdAt);
		
		// Informations entreprise (profil organisation ou variables d'environnement)
		this.buildCompanyInfo(doc, organization);
		
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
		
		// Conditions de paiement et mentions légales (conformité Axonaut / art. 289 CGI)
		this.buildPaymentTermsAndLegalMentions(doc, 'facture', organization, invoice);
		
		// Pied de page
		this.buildFooter(doc);
		
		doc.end();
	}

	/**
	 * Construit le contenu d'un devis PDF
	 */
	private buildQuote(doc: any, quote: any, organization?: any): void {
		// En-tête
		this.buildHeader(doc, `DEVIS ${quote.number}`, quote.createdAt);
		
		// Informations entreprise
		this.buildCompanyInfo(doc, organization);
		
		doc.moveDown(1);
		
		// Informations client
		this.buildClientInfo(doc, quote.client);
		
		doc.moveDown(1);
		
		// Date de validité si présente (style DanielCraftFr)
		if (quote.expiryDate) {
			doc.fontSize(10)
				.fillColor('#6b7280')
				.font('Helvetica')
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
		
		// Conditions et mentions légales devis
		this.buildPaymentTermsAndLegalMentions(doc, 'devis', organization, quote);
		
		// Pied de page
		this.buildFooter(doc);
		
		doc.end();
	}

	/**
	 * Construit l'en-tête du document (style DanielCraftFr)
	 */
	private buildHeader(doc: any, title: string, date?: Date | string): void {
		const headerY = doc.y;
		
		// Bande d'accent rouge (style DanielCraftFr)
		doc.rect(50, headerY, 495, 4)
			.fillColor('#dc2626')
			.fill();
		
		doc.moveDown(0.5);
		
		// Titre avec couleur primaire
		doc.fontSize(24)
			.fillColor('#dc2626')
			.font('Helvetica-Bold')
			.text(title, { align: 'right' });
		
		if (date) {
			doc.fontSize(10)
				.fillColor('#6b7280')
				.font('Helvetica')
				.text(`Date: ${new Date(date).toLocaleDateString('fr-FR')}`, { align: 'right' });
		}
		
		doc.moveDown(1);
		doc.strokeColor('#e5e7eb')
			.lineWidth(1)
			.moveTo(50, doc.y)
			.lineTo(545, doc.y)
			.stroke();
		doc.moveDown(1);
	}

	/**
	 * Construit les informations entreprise (profil organisation ou variables d'environnement)
	 */
	private buildCompanyInfo(doc: any, organization?: any): void {
		// Mention EI obligatoire (décret 2022) pour entreprise individuelle
		const isEI = organization?.companyStatus === 'AUTO_ENTREPRENEUR' || organization?.companyStatus === 'MICRO_ENTERPRISE';
		const nameRaw = organization?.name ?? process.env.COMPANY_NAME ?? 'Votre Entreprise';
		const companyName = isEI ? `Entrepreneur Individuel ${nameRaw}` : nameRaw;
		const parts = [
			organization?.address,
			organization?.address2,
			[organization?.zipCode, organization?.city].filter(Boolean).join(' '),
			organization?.country
		].filter(Boolean);
		const companyAddress = parts.length ? parts.join('\n') : (process.env.COMPANY_ADDRESS ?? 'Adresse de votre entreprise');
		const companySiret = organization?.siret ?? process.env.COMPANY_SIRET ?? '';
		const companyTva = organization?.vatNumber ?? process.env.COMPANY_VAT ?? '';
		const companyPhone = organization?.phone ?? process.env.COMPANY_PHONE ?? '';
		const companyEmail = organization?.email ?? process.env.COMPANY_EMAIL ?? '';
		const companyRcs = organization?.rcs ? (organization?.rcsCity ? `RCS ${organization.rcs} ${organization.rcsCity}` : `RCS ${organization.rcs}`) : '';

		doc.fontSize(14)
			.fillColor('#1f2937')
			.font('Helvetica-Bold')
			.text(companyName);

		doc.fontSize(10)
			.fillColor('#374151')
			.font('Helvetica')
			.text(companyAddress);

		if (companyPhone) {
			doc.text(`Tél. : ${companyPhone}`);
		}
		if (companyEmail) {
			doc.text(`Email : ${companyEmail}`);
		}
		if (companySiret) {
			doc.text(`SIRET : ${companySiret}`);
		}
		if (companyRcs) {
			doc.text(companyRcs);
		}
		if (companyTva) {
			doc.text(`TVA : ${companyTva}`);
		}
	}

	/**
	 * Construit les informations client (style DanielCraftFr)
	 */
	private buildClientInfo(doc: any, client: any): void {
		if (!client) return;
		
		doc.fontSize(10)
			.fillColor('#6b7280')
			.font('Helvetica')
			.text('Facturé à:', { continued: false });
		
		doc.fontSize(12)
			.fillColor('#1f2937')
			.font('Helvetica-Bold')
			.text(client.name || client.companyName || '');
		
		if (client.address) {
			doc.fontSize(10)
				.fillColor('#374151')
				.font('Helvetica')
				.text(client.address);
		}
		
		if (client.email) {
			doc.text(client.email);
		}
		// B2B : SIRET/SIREN obligatoires depuis 2022 (article décret 2022-1299)
		if (client.isCompany && client.vatNumber) {
			doc.text(`N° TVA : ${client.vatNumber}`);
		}
		if (client.isCompany && (client as any).siret) {
			doc.text(`SIRET : ${(client as any).siret}`);
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
		
		// En-tête du tableau (style DanielCraftFr avec couleur primaire)
		doc.fontSize(10)
			.fillColor('#ffffff')
			.font('Helvetica-Bold')
			.rect(50, tableTop, tableWidth, 25)
			.fill('#dc2626')
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
			
			// Fond alterné (style DanielCraftFr - gris très clair)
			if (i % 2 === 0) {
				doc.rect(50, lineY, tableWidth, itemHeight)
					.fillColor('#f9fafb')
					.fill()
					.fillColor('#1f2937');
			}
			
			// Contenu
			doc.fontSize(9)
				.fillColor('#1f2937')
				.text(line.description || '', 55, lineY + 10, { width: 240 })
				.text(String(line.quantity || 0), 300, lineY + 10)
				.text(`${this.formatCurrency(line.unitPrice || 0)}`, 350, lineY + 10)
				.text(`${(line.taxRate || 0) * 100}%`, 420, lineY + 10)
				.text(this.formatCurrency(line.total || 0), 450, lineY + 10);
		}
		
		// Bordure du tableau (style DanielCraftFr)
		doc.strokeColor('#e5e7eb')
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
			.fillColor('#374151');
		
		doc.text('Sous-total HT:', rightMargin - 150, startY, { width: 100, align: 'right' })
			.text(this.formatCurrency(totals.subtotal), rightMargin - 50, startY, { align: 'right' });
		
		doc.text('TVA:', rightMargin - 150, startY + lineHeight, { width: 100, align: 'right' })
			.text(this.formatCurrency(totals.tax), rightMargin - 50, startY + lineHeight, { align: 'right' });
		
		// Total TTC avec accent rouge (style DanielCraftFr)
		doc.fontSize(12)
			.fillColor('#dc2626')
			.font('Helvetica-Bold')
			.text('Total TTC:', rightMargin - 150, startY + (lineHeight * 2), { width: 100, align: 'right' })
			.text(this.formatCurrency(totals.total), rightMargin - 50, startY + (lineHeight * 2), { align: 'right' });
		
		doc.y = startY + (lineHeight * 3) + 10;
	}

	/**
	 * Construit les conditions de paiement et mentions légales (conformité loi factures, Axonaut).
	 * Facture : date d'échéance, escompte, pénalités de retard, mention TVA franchise si applicable.
	 * Devis : validité, conditions d'acceptation.
	 */
	private buildPaymentTermsAndLegalMentions(doc: any, type: 'facture' | 'devis', organization?: any, document?: any): void {
		doc.fontSize(8).fillColor('#6b7280').font('Helvetica');
		const lines: string[] = [];

		if (type === 'facture') {
			if (document?.dueDate) {
				lines.push(`Date d'échéance : ${new Date(document.dueDate).toLocaleDateString('fr-FR')}.`);
			}
			lines.push('Escompte pour paiement anticipé : néant.');
			lines.push('Pénalités de retard : au taux légal en vigueur (3 fois le taux d\'intérêt légal). Indemnité forfaitaire pour frais de recouvrement : 40 €.');
			if (document?.legalMention) {
				lines.push(document.legalMention);
			}
			// Franchise de TVA (auto-entrepreneur / art. 293 B CGI)
			const vatExempt = organization?.taxRegime && String(organization.taxRegime).toLowerCase().includes('franchise') ||
				organization?.companyStatus === 'AUTO_ENTREPRENEUR' || organization?.companyStatus === 'MICRO_ENTERPRISE';
			if (vatExempt) {
				lines.push('TVA non applicable, article 293 B du CGI.');
			}
			lines.push('Facture établie conformément aux dispositions légales en vigueur.');
		} else {
			lines.push('Devis valable 30 jours à compter de la date d\'émission (à moins qu\'une autre durée ne soit indiquée).');
			lines.push('Acceptation par signature ou bon de commande.');
		}

		const customMentions = process.env.LEGAL_MENTIONS || (organization as any)?.legalMentions;
		if (customMentions) {
			lines.push(customMentions);
		}
		doc.text(lines.join(' '), { align: 'justify' });
	}

	/**
	 * Construit le pied de page
	 */
	private buildFooter(doc: any): void {
		const pageHeight = doc.page.height;
		const footerY = pageHeight - 50;
		
		doc.fontSize(8)
			.fillColor('#9ca3af')
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
