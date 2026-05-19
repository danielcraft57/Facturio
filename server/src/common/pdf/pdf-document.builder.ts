import * as fs from 'fs';
import { getHeaderWaveImagePath } from './pdf-assets';
import { buildFrenchLegalFooter, formatPostalAddress } from './pdf-legal-mentions';
import { tryEmbedSignatureImage } from './pdf-signature.util';
import {
	PDF_LAYOUT,
	PDF_THEME,
	type PdfCompanyInfo,
	type PdfDocumentKind,
	type PdfTotals
} from './pdf-theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfDoc = any;

export interface BuildPdfDocumentOptions {
	kind: PdfDocumentKind;
	number: string;
	date?: Date | string;
	company: PdfCompanyInfo;
	client: any;
	lines: any[];
	totals: PdfTotals;
	organization?: any;
	document?: any;
	expiryDate?: Date | string;
	/** Image (data URL / fichier) ou nom signataire — prioritaire sur organization.signature */
	signature?: string | null;
	/** Date affichée dans le cadre signature (défaut : date du document) */
	signatureDate?: Date | string;
}

/**
 * Construit le contenu visuel d'une facture ou d'un devis (template corporate).
 */
export class PdfDocumentBuilder {
	constructor(private readonly logger?: { warn: (msg: string, err?: unknown) => void }) {}

	build(doc: PdfDoc, options: BuildPdfDocumentOptions): void {
		const { marginX, contentWidth, pageWidth } = PDF_LAYOUT;
		const headerBottom = this.drawHeader(doc, options);
		doc.y = headerBottom + PDF_LAYOUT.padSm;

		this.drawClientBlock(doc, options.client, options.kind);
		this.drawDocumentMeta(doc, options);

		this.drawLinesTable(doc, options.lines);
		doc.y += PDF_LAYOUT.sectionGap;
		this.drawTotals(doc, options.totals);
		doc.y += PDF_LAYOUT.padLg;

		const blockY = doc.y;
		const signatureHeight = 88;
		const leftWidth = contentWidth * 0.58;
		const rightX = marginX + leftWidth + 16;
		const rightWidth = contentWidth - leftWidth - 16;

		this.drawPaymentBlock(doc, options, marginX, blockY, leftWidth);
		const signatureValue =
			options.signature ?? options.organization?.signature ?? null;
		const signatureDate = options.signatureDate ?? options.date ?? new Date();
		this.drawSignatureBox(doc, rightX, blockY, rightWidth, signatureHeight, {
			date: signatureDate,
			signature: signatureValue,
		});

		const contentEndY = Math.max(doc.y, blockY + signatureHeight + 8);
		this.drawLegalFooterBand(doc, options, contentEndY);
	}

	private drawHeader(doc: PdfDoc, options: BuildPdfDocumentOptions): number {
		const { pageWidth, headerHeight, marginX, contentWidth } = PDF_LAYOUT;
		const label = options.kind === 'facture' ? 'Facture' : 'Devis';
		const title = `${label} n° ${options.number}`;

		this.drawHeaderWaves(doc, pageWidth, headerHeight);
		this.drawHeaderBackground(doc, pageWidth, headerHeight); // PNG optionnel si présent dans assets/

		const titleX = marginX + PDF_LAYOUT.padSm;
		doc.fontSize(18)
			.fillColor(PDF_THEME.white)
			.font('Helvetica-Bold')
			.text(title, titleX, 36, { width: contentWidth * 0.55, lineGap: 2 });

		if (options.date) {
			doc.fontSize(9)
				.fillColor(PDF_THEME.white)
				.font('Helvetica')
				.text(
					`Date : ${new Date(options.date).toLocaleDateString('fr-FR')}`,
					titleX,
					64,
					{ width: contentWidth * 0.5, lineGap: 2 }
				);
		}

		const companyX = pageWidth - marginX - 220;
		const companyY = 94;
		this.drawCompanyBlock(doc, options.company, companyX, companyY, 220);

		return PDF_LAYOUT.headerContentBottom;
	}

	/** Bandeau décoratif PNG (optionnel, < 400 Ko) par-dessus les vagues vectorielles */
	private drawHeaderBackground(doc: PdfDoc, pageWidth: number, headerHeight: number): void {
		const imagePath = getHeaderWaveImagePath();
		if (!imagePath) return;
		try {
			const { size } = fs.statSync(imagePath);
			if (size > 400_000) return;
			doc.save();
			doc.opacity(0.92);
			doc.image(imagePath, 0, 0, { width: pageWidth, height: headerHeight + 6 });
			doc.opacity(1);
			doc.restore();
		} catch (err) {
			this.logger?.warn('Image en-tête PDF non chargée', err);
		}
	}

	/** Vagues bleu marine et rouge (style template corporate) */
	private drawHeaderWaves(doc: PdfDoc, pageWidth: number, headerHeight: number): void {
		const h = headerHeight;
		doc.save();
		doc.moveTo(0, 0).lineTo(pageWidth, 0).lineTo(pageWidth, h * 0.5);
		doc.bezierCurveTo(pageWidth * 0.78, h * 1.02, pageWidth * 0.38, h * 0.32, 0, h * 0.68);
		doc.lineTo(0, 0).fill(PDF_THEME.navy);

		doc.moveTo(0, h * 0.48)
			.bezierCurveTo(pageWidth * 0.22, h * 0.92, pageWidth * 0.58, h * 0.38, pageWidth, h * 0.62)
			.lineTo(pageWidth, h * 0.42)
			.bezierCurveTo(pageWidth * 0.5, h * 0.15, pageWidth * 0.18, h * 0.52, 0, h * 0.34)
			.closePath()
			.fill(PDF_THEME.red);
		doc.restore();
	}

	private drawCompanyBlock(
		doc: PdfDoc,
		company: PdfCompanyInfo,
		x: number,
		y: number,
		width: number
	): void {
		let cursorY = y;

		if (company.logo) {
			const embedded = this.tryEmbedLogo(doc, company.logo, x + width - 52, y, 48);
			if (embedded) cursorY = y + 52;
		}

		doc.fontSize(13)
			.fillColor(PDF_THEME.navy)
			.font('Helvetica-Bold')
			.text(company.name, x, cursorY, { width, align: 'right', lineGap: 2 });

		cursorY = doc.y + 4;
		doc.fontSize(8).fillColor(PDF_THEME.text).font('Helvetica');

		if (company.legalForm) {
			doc.fontSize(7).fillColor(PDF_THEME.textMuted);
			doc.text(company.legalForm, x, cursorY, { width, align: 'right', lineGap: 1 });
			cursorY = doc.y + 4;
			doc.fontSize(8).fillColor(PDF_THEME.text);
		}

		const contactLines = [
			company.address,
			company.phone ? `Tél. : ${company.phone}` : '',
			company.email,
			company.website
		].filter(Boolean);

		for (const line of contactLines) {
			const lines = line.includes('\n') ? line.split('\n') : [line];
			for (const part of lines) {
				doc.text(part, x, cursorY, { width, align: 'right', lineGap: 1 });
				cursorY = doc.y + 3;
			}
		}

		const legalIds = [
			company.siret ? `SIRET : ${company.siret}` : '',
			company.rcs,
			company.vat ? `TVA : ${company.vat}` : ''
		].filter(Boolean);
		if (legalIds.length) {
			doc.fontSize(7).fillColor(PDF_THEME.textMuted);
			doc.text(legalIds.join(' · '), x, cursorY + 2, { width, align: 'right', lineGap: 1 });
		}

		doc.x = PDF_LAYOUT.marginX;
	}

	private tryEmbedLogo(doc: PdfDoc, logo: string, x: number, y: number, size: number): boolean {
		try {
			if (logo.startsWith('data:image')) {
				const base64 = logo.split(',')[1];
				if (!base64) return false;
				doc.image(Buffer.from(base64, 'base64'), x, y, {
					fit: [size, size],
					align: 'right',
					valign: 'top'
				});
				return true;
			}
			if (fs.existsSync(logo)) {
				doc.image(logo, x, y, { fit: [size, size] });
				return true;
			}
		} catch (err) {
			this.logger?.warn('Logo organisation non chargé', err);
		}
		return false;
	}

	private drawClientBlock(doc: PdfDoc, client: any, kind: PdfDocumentKind): void {
		if (!client) return;

		const { marginX, contentWidth } = PDF_LAYOUT;
		const clientLabel = kind === 'facture' ? 'Facturé à' : 'Client';
		const boxY = doc.y;
		const boxPad = PDF_LAYOUT.padMd;
		const textW = contentWidth - boxPad * 2;
		const name = client.name || client.companyName || '—';

		const lines: string[] = [];
		if (client.address) lines.push(client.address);
		if (client.email) lines.push(client.email);
		if (client.phone) lines.push(`Tél. : ${client.phone}`);
		if (client.isCompany && client.vatNumber) {
			lines.push(`N° TVA intracommunautaire : ${client.vatNumber}`);
		}
		if (client.isCompany && client.siret) lines.push(`SIRET : ${client.siret}`);

		const titleH = 18;
		const lineH = 14;
		const boxH = boxPad * 2 + titleH + lines.length * lineH;

		doc.save();
		doc.roundedRect(marginX, boxY, contentWidth, boxH, 8).fill(PDF_THEME.rowAlt);
		doc.roundedRect(marginX, boxY, contentWidth, boxH, 8).lineWidth(1);
		doc.strokeColor(PDF_THEME.border).stroke();
		doc.restore();

		doc.fontSize(10)
			.fillColor(PDF_THEME.navy)
			.font('Helvetica-Bold')
			.text(`${clientLabel} : `, marginX + boxPad, boxY + boxPad, { continued: true })
			.font('Helvetica')
			.fillColor(PDF_THEME.textDark)
			.text(name, { width: textW });

		doc.fontSize(9).fillColor(PDF_THEME.text).font('Helvetica');
		let innerY = boxY + boxPad + titleH;
		for (const line of lines) {
			doc.text(line, marginX + boxPad, innerY, { width: textW });
			innerY += lineH;
		}

		doc.y = boxY + boxH + PDF_LAYOUT.sectionGap;
	}

	private drawDocumentMeta(doc: PdfDoc, options: BuildPdfDocumentOptions): void {
		const { marginX, contentWidth } = PDF_LAYOUT;
		const items: string[] = [];

		if (options.date) {
			items.push(
				`Date d'émission : ${new Date(options.date).toLocaleDateString('fr-FR')}`
			);
		}
		if (options.kind === 'facture' && options.document?.dueDate) {
			items.push(
				`Date d'échéance : ${new Date(options.document.dueDate).toLocaleDateString('fr-FR')}`
			);
		}
		if (options.kind === 'devis' && options.expiryDate) {
			items.push(
				`Validité : jusqu'au ${new Date(options.expiryDate).toLocaleDateString('fr-FR')}`
			);
		}
		if (!items.length) return;

		doc.fontSize(8)
			.fillColor(PDF_THEME.textMuted)
			.font('Helvetica')
			.text(items.join('   ·   '), marginX, doc.y + PDF_LAYOUT.padSm, {
				width: contentWidth,
				align: 'right',
				lineGap: 2
			});
		doc.y += PDF_LAYOUT.sectionGap;
	}

	private drawLinesTable(doc: PdfDoc, lines: any[]): void {
		if (!lines.length) return;

		const {
			marginX,
			contentWidth,
			tableHeaderHeight,
			lineHeight,
			tableCellPadX,
			tableCellPadY
		} = PDF_LAYOUT;
		const tableTop = doc.y;
		const radius = 14;

		doc.save();
		doc.roundedRect(marginX, tableTop, contentWidth, tableHeaderHeight, radius).lineWidth(1.5);
		doc.strokeColor(PDF_THEME.red).stroke();
		doc.restore();

		const cols = {
			desc: marginX + tableCellPadX,
			unit: marginX + 255,
			qty: marginX + 340,
			total: marginX + 400
		};
		const headerTextY = tableTop + tableCellPadY;

		doc.fontSize(9)
			.fillColor(PDF_THEME.navy)
			.font('Helvetica-Bold')
			.text('Description', cols.desc, headerTextY, { width: 230 })
			.text('Prix unitaire', cols.unit, headerTextY, { width: 75, align: 'center' })
			.text('Quantité', cols.qty, headerTextY, { width: 50, align: 'center' })
			.text('Total HT', cols.total, headerTextY, {
				width: 80 - tableCellPadX,
				align: 'right'
			});

		let rowY = tableTop + tableHeaderHeight;
		doc.font('Helvetica').fontSize(9);

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (i % 2 === 0) {
				doc.rect(marginX, rowY, contentWidth, lineHeight).fill(PDF_THEME.rowAlt);
			}
			const cellY = rowY + tableCellPadY;
			doc.fillColor(PDF_THEME.textDark)
				.text(line.description || '', cols.desc, cellY, { width: 230 })
				.text(this.formatCurrency(line.unitPrice || 0), cols.unit, cellY, {
					width: 75,
					align: 'center'
				})
				.text(String(line.quantity ?? 0), cols.qty, cellY, { width: 50, align: 'center' })
				.text(
					this.formatCurrency(line.quantity * line.unitPrice || line.total || 0),
					cols.total,
					cellY,
					{ width: 80 - tableCellPadX, align: 'right' }
				);
			rowY += lineHeight;
		}

		doc.strokeColor(PDF_THEME.border)
			.lineWidth(0.75)
			.rect(marginX, tableTop, contentWidth, rowY - tableTop)
			.stroke();

		doc.y = rowY + PDF_LAYOUT.padMd;
	}

	private drawTotals(doc: PdfDoc, totals: PdfTotals): void {
		const { marginX, contentWidth } = PDF_LAYOUT;
		const boxWidth = 210;
		const boxX = marginX + contentWidth - boxWidth;
		const startY = doc.y;
		const rowH = 18;

		const taxRate =
			totals.subtotal > 0 ? Math.round((totals.tax / totals.subtotal) * 100) : 0;

		doc.fontSize(9).fillColor(PDF_THEME.text).font('Helvetica');
		doc.text('Sous-total', boxX, startY, { width: 100 })
			.text(this.formatCurrency(totals.subtotal), boxX + 100, startY, {
				width: 110,
				align: 'right'
			});
		doc.text(`TVA (${taxRate} %)`, boxX, startY + rowH, { width: 100 }).text(
			this.formatCurrency(totals.tax),
			boxX + 100,
			startY + rowH,
			{ width: 110, align: 'right' }
		);

		const barY = startY + rowH * 2 + 6;
		const barH = 30;
		doc.roundedRect(boxX, barY, boxWidth, barH, 15).fill(PDF_THEME.red);
		doc.fontSize(11)
			.fillColor(PDF_THEME.white)
			.font('Helvetica-Bold')
			.text('Total TTC', boxX + 14, barY + 9, { width: 80 })
			.text(this.formatCurrency(totals.total), boxX + 90, barY + 9, {
				width: boxWidth - 100,
				align: 'right'
			});

		doc.y = barY + barH + 8;
	}

	private drawPaymentBlock(
		doc: PdfDoc,
		options: BuildPdfDocumentOptions,
		x: number,
		y: number,
		width: number
	): void {
		const iban = process.env.COMPANY_IBAN;
		const lines: string[] = [];

		if (options.document?.paymentNote) {
			lines.push(String(options.document.paymentNote));
		} else if (options.kind === 'facture') {
			lines.push('Mode de règlement : virement bancaire.');
			if (options.document?.dueDate) {
				lines.push(
					`À régler avant le ${new Date(options.document.dueDate).toLocaleDateString('fr-FR')}.`
				);
			}
		} else if (options.kind === 'devis') {
			lines.push('Modalités : selon accord après acceptation du devis.');
		}
		if (iban) {
			lines.push(`IBAN : ${iban}`);
		}

		doc.fontSize(9).fillColor(PDF_THEME.navy).font('Helvetica-Bold');
		doc.text('Paiement', x, y, { width });
		let cursorY = doc.y + PDF_LAYOUT.padSm;
		doc.fontSize(8.5).fillColor(PDF_THEME.text).font('Helvetica');
		for (const line of lines) {
			doc.text(`• ${line}`, x, cursorY, { width, lineGap: 4 });
			cursorY = doc.y + 4;
		}
		doc.y = cursorY;
	}

	private drawLegalFooterBand(doc: PdfDoc, options: BuildPdfDocumentOptions, contentEndY: number): void {
		const { marginX, contentWidth } = PDF_LAYOUT;
		const pageHeight = doc.page.height;
		const bottomMargin = doc.page.margins?.bottom ?? 50;
		const maxY = pageHeight - bottomMargin;

		const legal = buildFrenchLegalFooter({
			kind: options.kind,
			company: options.company,
			organization: options.organization,
			document: options.document,
			expiryDate: options.expiryDate
		});

		const pad = PDF_LAYOUT.padMd;
		const fontSize = 6.5;
		const lineGap = 3;
		doc.font('Helvetica').fontSize(fontSize);

		let textHeight = 12;
		textHeight += doc.heightOfString(legal.issuerLine, { width: contentWidth - pad * 2, lineGap });
		for (const p of legal.paragraphs) {
			textHeight += doc.heightOfString(p, { width: contentWidth - pad * 2, lineGap }) + 3;
		}
		textHeight += 14;

		let bandTop = maxY - textHeight;
		if (contentEndY + 12 > bandTop) {
			bandTop = contentEndY + 12;
		}

		const bandHeight = Math.min(textHeight, maxY - bandTop);
		if (bandHeight < 20) return;

		doc.save();
		doc.rect(marginX, bandTop, contentWidth, bandHeight).fill(PDF_THEME.legalBg);
		doc.restore();

		let y = bandTop + pad;
		doc.fontSize(6.5).fillColor(PDF_THEME.navy).font('Helvetica-Bold');
		doc.text('Mentions légales et conditions contractuelles', marginX + pad, y, {
			width: contentWidth - pad * 2
		});
		y = doc.y + 3;

		doc.font('Helvetica').fontSize(fontSize).fillColor(PDF_THEME.textDark);
		doc.text(legal.issuerLine, marginX + pad, y, {
			width: contentWidth - pad * 2,
			lineGap
		});
		y = doc.y + 4;

		doc.fillColor(PDF_THEME.text);
		for (const paragraph of legal.paragraphs) {
			doc.text(paragraph, marginX + pad, y, {
				width: contentWidth - pad * 2,
				lineGap,
				align: 'justify'
			});
			y = doc.y + 3;
		}

		doc.fontSize(6).fillColor(PDF_THEME.textMuted);
		doc.text(
			`Page ${doc.page.number} — Document généré par Facturio`,
			marginX + pad,
			bandTop + bandHeight - 11,
			{ width: contentWidth - pad * 2, align: 'center', lineBreak: false }
		);

		doc.x = marginX;
		doc.y = Math.min(bandTop + bandHeight, maxY);
	}

	private drawSignatureBox(
		doc: PdfDoc,
		x: number,
		y: number,
		width: number,
		height: number,
		opts: { date: Date | string; signature?: string | null },
	): void {
		const radius = 12;
		doc.roundedRect(x, y, width, height, radius).lineWidth(1.5);
		doc.strokeColor(PDF_THEME.red).stroke();

		const sigPad = PDF_LAYOUT.padMd;
		const dateStr = new Date(opts.date).toLocaleDateString('fr-FR');
		doc.fontSize(9)
			.fillColor(PDF_THEME.navy)
			.font('Helvetica-Bold')
			.text(`Date : ${dateStr}`, x + sigPad, y + sigPad, { width: width - sigPad * 2 });

		const sigLabelY = y + sigPad + 22;
		doc.text('Signature :', x + sigPad, sigLabelY, { width: width - sigPad * 2 });

		const sigContentY = sigLabelY + 14;
		const sigMaxH = y + height - sigContentY - sigPad;
		const sigMaxW = width - sigPad * 2;

		if (opts.signature?.trim()) {
			const embedded = tryEmbedSignatureImage(
				doc,
				opts.signature.trim(),
				x + sigPad,
				sigContentY,
				sigMaxW,
				Math.max(sigMaxH, 28),
			);
			if (!embedded) {
				doc.fontSize(9)
					.fillColor(PDF_THEME.textDark)
					.font('Helvetica-Oblique')
					.text(opts.signature.trim(), x + sigPad, sigContentY, {
						width: sigMaxW,
						lineGap: 2,
					});
			}
		}
	}

	private formatCurrency(amount: number): string {
		return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
	}
}

function formatLegalForm(organization?: any): string | undefined {
	const status = organization?.companyStatus;
	if (status === 'AUTO_ENTREPRENEUR' || status === 'MICRO_ENTERPRISE') {
		return 'Entrepreneur individuel (micro-entreprise)';
	}
	if (organization?.legalForm) return organization.legalForm;
	return undefined;
}

function formatCapital(organization?: any): string | undefined {
	if (organization?.capital == null) return undefined;
	const n = Number(organization.capital);
	if (Number.isNaN(n)) return undefined;
	return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

/** Extrait les infos société depuis l'organisation ou les variables d'environnement */
export function resolveCompanyInfo(organization?: any): PdfCompanyInfo {
	const isEI =
		organization?.companyStatus === 'AUTO_ENTREPRENEUR' ||
		organization?.companyStatus === 'MICRO_ENTERPRISE';
	const nameRaw =
		organization?.legalName ||
		organization?.name ||
		process.env.COMPANY_NAME ||
		'Votre Entreprise';
	const name = nameRaw;

	const postal = formatPostalAddress(organization);
	const envAddress = process.env.COMPANY_ADDRESS ?? '';

	return {
		name,
		legalForm: formatLegalForm(organization),
		capital: formatCapital(organization),
		address: postal || envAddress,
		phone: organization?.phone ?? process.env.COMPANY_PHONE ?? '',
		email: organization?.email ?? process.env.COMPANY_EMAIL ?? '',
		website: organization?.website ?? '',
		siret: organization?.siret ?? process.env.COMPANY_SIRET ?? '',
		rcs: organization?.rcs
			? organization?.rcsCity
				? `RCS ${organization.rcs} ${organization.rcsCity}`
				: `RCS ${organization.rcs}`
			: '',
		vat: organization?.vatNumber ?? process.env.COMPANY_VAT ?? '',
		apeCode: organization?.apeCode ?? undefined,
		logo: organization?.logo ?? null
	};
}
