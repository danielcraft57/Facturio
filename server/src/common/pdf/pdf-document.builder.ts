import * as fs from 'fs';
import { parseTagsJson } from '../document-folder.util';
import { formatPdfCurrency } from './pdf-currency.util';
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

	// Prisma peut renvoyer des Decimal (avec une méthode `toNumber()`).
	private toNumber(value: unknown): number {
		return Number((value as { toNumber?: () => number } | null | undefined)?.toNumber?.() ?? value ?? 0);
	}

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

		const { blockY, footerBandTop, signatureHeight } = this.prepareClosingSection(doc, options);
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

		doc.save();
		doc.strokeColor(PDF_THEME.border)
			.lineWidth(0.5)
			.moveTo(marginX, footerBandTop - 10)
			.lineTo(marginX + contentWidth, footerBandTop - 10)
			.stroke();
		doc.restore();

		this.drawLegalFooterAt(doc, options, footerBandTop);
	}

	/** Réserve paiement + signature au-dessus du bandeau légal calé en bas de page. */
	private prepareClosingSection(
		doc: PdfDoc,
		options: BuildPdfDocumentOptions,
	): { blockY: number; footerBandTop: number; signatureHeight: number } {
		const signatureHeight = 88;
		const footerHeight = this.measureLegalFooterHeight(doc, options);
		const paymentHeight = this.estimatePaymentBlockHeight(doc, options);
		const bodyHeight = Math.max(paymentHeight, signatureHeight) + 24;
		const maxY = this.getPageMaxY(doc);
		let footerBandTop = maxY - footerHeight;

		if (doc.y + bodyHeight > footerBandTop - 10) {
			doc.addPage();
			doc.y = doc.page.margins?.top ?? 72;
			footerBandTop = maxY - footerHeight;
		}

		return { blockY: doc.y, footerBandTop, signatureHeight };
	}

	private getPageMaxY(doc: PdfDoc): number {
		const pageHeight = doc.page.height;
		const bottomMargin = doc.page.margins?.bottom ?? 50;
		return pageHeight - bottomMargin;
	}

	private getPageContentBottom(doc: PdfDoc, footerReserve = 230): number {
		const pageHeight = doc.page.height;
		const bottomMargin = doc.page.margins?.bottom ?? 50;
		return pageHeight - bottomMargin - footerReserve;
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
		const colDescW = 228;
		const colUnitW = 92;
		const colQtyW = 48;
		const colTotalW = contentWidth - colDescW - colUnitW - colQtyW - tableCellPadX * 2;
		const cols = {
			desc: marginX + tableCellPadX,
			unit: marginX + tableCellPadX + colDescW,
			qty: marginX + tableCellPadX + colDescW + colUnitW,
			total: marginX + tableCellPadX + colDescW + colUnitW + colQtyW,
		};

		let tableTop = doc.y;
		let rowY = this.drawTableHeader(doc, tableTop, cols, {
			colDescW,
			colUnitW,
			colQtyW,
			colTotalW,
			tableHeaderHeight,
			tableCellPadY,
			contentWidth,
			marginX,
		});
		doc.font('Helvetica').fontSize(9);
		const pageBottom = this.getPageContentBottom(doc, 72);

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const description = line.description || '';
			const descHeight = doc.heightOfString(description, { width: colDescW });
			const rowH = Math.max(lineHeight, descHeight + tableCellPadY * 2);

			if (rowY + rowH > pageBottom) {
				doc.strokeColor(PDF_THEME.border)
					.lineWidth(0.75)
					.rect(marginX, tableTop, contentWidth, rowY - tableTop)
					.stroke();
				doc.addPage();
				tableTop = (doc.page.margins?.top ?? 72) + PDF_LAYOUT.padSm;
				rowY = this.drawTableHeader(doc, tableTop, cols, {
					colDescW,
					colUnitW,
					colQtyW,
					colTotalW,
					tableHeaderHeight,
					tableCellPadY,
					contentWidth,
					marginX,
				});
				doc.font('Helvetica').fontSize(9);
			}

			if (i % 2 === 0) {
				doc.rect(marginX, rowY, contentWidth, rowH).fill(PDF_THEME.rowAlt);
			}
			const cellY = rowY + tableCellPadY;
			const unitPrice = this.toNumber(line.unitPrice);
			const quantity = this.toNumber(line.quantity);
			const lineTotalHtFromFields = unitPrice * quantity;
			const lineTotalHtFromTotalField = this.toNumber(line.total);
			const lineTotalHt = Number.isFinite(lineTotalHtFromFields)
				? lineTotalHtFromFields
				: lineTotalHtFromTotalField;
			doc.fillColor(PDF_THEME.textDark)
				.text(description, cols.desc, cellY, { width: colDescW })
				.text(this.formatCurrency(unitPrice), cols.unit, cellY, {
					width: colUnitW,
					align: 'right',
					lineBreak: false,
				})
				.text(String(quantity), cols.qty, cellY, { width: colQtyW, align: 'center' })
				.text(
					this.formatCurrency(lineTotalHt),
					cols.total,
					cellY,
					{ width: colTotalW, align: 'right', lineBreak: false },
				);
			rowY += rowH;
		}

		doc.strokeColor(PDF_THEME.border)
			.lineWidth(0.75)
			.rect(marginX, tableTop, contentWidth, rowY - tableTop)
			.stroke();

		doc
			.font('Helvetica')
			.fontSize(7.5)
			.fillColor(PDF_THEME.textMuted)
			.text('Montants des lignes exprimés en HT (hors TVA).', marginX, rowY + 4, {
				width: contentWidth,
				align: 'left',
			});

		doc.y = rowY + 20;
	}

	private drawTableHeader(
		doc: PdfDoc,
		tableTop: number,
		cols: { desc: number; unit: number; qty: number; total: number },
		layout: {
			colDescW: number;
			colUnitW: number;
			colQtyW: number;
			colTotalW: number;
			tableHeaderHeight: number;
			tableCellPadY: number;
			contentWidth: number;
			marginX: number;
		},
	): number {
		const radius = 14;
		doc.save();
		doc.roundedRect(layout.marginX, tableTop, layout.contentWidth, layout.tableHeaderHeight, radius)
			.lineWidth(1.5);
		doc.strokeColor(PDF_THEME.red).stroke();
		doc.restore();

		const headerTextY = tableTop + layout.tableCellPadY;
		doc.fontSize(9)
			.fillColor(PDF_THEME.navy)
			.font('Helvetica-Bold')
			.text('Description', cols.desc, headerTextY, { width: layout.colDescW })
			.text('Prix unit. HT', cols.unit, headerTextY, { width: layout.colUnitW, align: 'right' })
			.text('Qté', cols.qty, headerTextY, { width: layout.colQtyW, align: 'center' })
			.text('Total HT', cols.total, headerTextY, {
				width: layout.colTotalW,
				align: 'right',
			});
		return tableTop + layout.tableHeaderHeight;
	}

	private estimatePaymentBlockHeight(doc: PdfDoc, options: BuildPdfDocumentOptions): number {
		const tags = parseTagsJson(options.document?.tags ?? null);
		const breakdown = options.document?.engagementBreakdown as
			| { contractTotal?: number }
			| undefined;
		const hasBreakdown = Boolean(breakdown && Number.isFinite(breakdown.contractTotal));
		if (hasBreakdown) return 130;
		let h = 28;
		if (options.document?.paymentNote) {
			h += doc.heightOfString(String(options.document.paymentNote), { width: 260, lineGap: 3 }) + 8;
		} else {
			h += 36;
		}
		return h;
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
				align: 'right',
				lineBreak: false,
			});
		doc.text(`TVA (${taxRate} %)`, boxX, startY + rowH, { width: 100 }).text(
			this.formatCurrency(totals.tax),
			boxX + 100,
			startY + rowH,
			{ width: 110, align: 'right', lineBreak: false },
		);

		const creditApplied = Number(totals.creditApplied ?? 0);
		const hasCredit = creditApplied > 0.01;
		let rowOffset = 2;
		if (hasCredit) {
			const creditY = startY + rowH * rowOffset;
			doc.fontSize(9)
				.fillColor(PDF_THEME.text)
				.font('Helvetica')
				.text('Total TTC', boxX, creditY, { width: 100 })
				.text(this.formatCurrency(totals.total), boxX + 100, creditY, {
					width: 110,
					align: 'right',
					lineBreak: false,
				});
			rowOffset += 1;
			const avoirY = startY + rowH * rowOffset;
			doc.text('Avoir imputé', boxX, avoirY, { width: 100 }).text(
				`− ${this.formatCurrency(creditApplied)}`,
				boxX + 100,
				avoirY,
				{ width: 110, align: 'right', lineBreak: false },
			);
			rowOffset += 1;
		}

		const barY = startY + rowH * rowOffset + 6;
		const barH = 30;
		const netLabel = hasCredit ? 'Net à payer' : 'Total TTC';
		const netAmount = hasCredit
			? Number(totals.netDue ?? Math.max(0, totals.total - creditApplied))
			: totals.total;
		doc.roundedRect(boxX, barY, boxWidth, barH, 15).fill(PDF_THEME.red);
		doc.fontSize(11)
			.fillColor(PDF_THEME.white)
			.font('Helvetica-Bold')
			.text(netLabel, boxX + 14, barY + 9, { width: 80 })
			.text(this.formatCurrency(netAmount), boxX + 90, barY + 9, {
				width: boxWidth - 100,
				align: 'right',
				lineBreak: false,
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
		const tags = parseTagsJson(options.document?.tags ?? null);
		const isDeposit = tags.includes('ACOMPTE_10');
		const isRemainder = tags.includes('SOLDE_APRES_ACOMPTE');
		const breakdown = options.document?.engagementBreakdown as
			| { contractTotal?: number; depositAmount?: number; remainderAmount?: number }
			| undefined;
		const hasBreakdown = Boolean(breakdown && Number.isFinite(breakdown.contractTotal));

		doc.fontSize(9).fillColor(PDF_THEME.navy).font('Helvetica-Bold');
		doc.text(hasBreakdown ? 'Récapitulatif du devis' : 'Paiement', x, y, { width });
		let cursorY = doc.y + PDF_LAYOUT.padSm;

		if (hasBreakdown && breakdown) {
			const totalContract = Number(breakdown.contractTotal ?? 0);
			const depositAmount = Number(breakdown.depositAmount ?? 0);
			const remainder = Number(
				breakdown.remainderAmount != null
					? breakdown.remainderAmount
					: totalContract - depositAmount,
			);
			const labelW = width * 0.64;
			const amountW = width - labelW;
			const rows: { label: string; amount: number; bold?: boolean; muted?: boolean }[] = [
				{ label: 'Total du devis', amount: totalContract },
				{
					label: isRemainder ? 'Paiement acompte (10 %) — réglé' : 'Paiement acompte (10 %)',
					amount: depositAmount,
					bold: isDeposit,
					muted: isRemainder,
				},
				{
					label: isDeposit ? 'Solde — facturé plus tard' : 'Solde — sur cette facture',
					amount: remainder,
					bold: isRemainder,
					muted: isDeposit,
				},
			];

			for (const row of rows) {
				doc
					.font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
					.fontSize(8.5)
					.fillColor(row.muted ? PDF_THEME.textMuted : PDF_THEME.text);
				doc.text(row.label, x, cursorY, { width: labelW });
				doc.text(this.formatCurrency(row.amount), x + labelW, cursorY, { width: amountW, align: 'right' });
				cursorY += 15;
			}

			const invoiceTotal = Number(options.totals?.total ?? options.document?.total ?? 0);
			if ((isDeposit || isRemainder) && invoiceTotal > 0) {
				cursorY += 4;
				const boxH = 30;
				doc
					.roundedRect(x, cursorY, width, boxH, 4)
					.fillAndStroke('#f8fafc', PDF_THEME.navy);
				doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
				doc.text('Montant de cette facture', x + 8, cursorY + 5, { width: width - 16 });
				doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_THEME.navy);
				doc.text(this.formatCurrency(invoiceTotal), x + 8, cursorY + 14, {
					width: width - 16,
					align: 'right',
				});
				cursorY += boxH + 8;
			}
		} else {
			const lines: string[] = [];
			if (options.document?.paymentNote) {
				lines.push(String(options.document.paymentNote));
			} else if (options.kind === 'facture') {
				lines.push('Mode de règlement : virement bancaire.');
				if (options.document?.dueDate) {
					lines.push(
						`À régler avant le ${new Date(options.document.dueDate).toLocaleDateString('fr-FR')}.`,
					);
				}
			} else if (options.kind === 'devis') {
				lines.push('Modalités : selon accord après acceptation du devis.');
			}
			if (iban) lines.push(`IBAN : ${iban}`);

			doc.fontSize(8.5).fillColor(PDF_THEME.text).font('Helvetica');
			for (const line of lines) {
				doc.text(`• ${line}`, x, cursorY, { width, lineGap: 4 });
				cursorY = doc.y + 4;
			}
		}

		if (hasBreakdown && options.document?.paymentNote) {
			doc.font('Helvetica').fontSize(8).fillColor(PDF_THEME.text);
			doc.text(String(options.document.paymentNote), x, cursorY, { width, lineGap: 3 });
			cursorY = doc.y + 4;
		}

		if (hasBreakdown && iban) {
			doc.font('Helvetica').fontSize(8).fillColor(PDF_THEME.textMuted);
			doc.text(`IBAN : ${iban}`, x, cursorY, { width });
			cursorY = doc.y + 4;
		}

		doc.y = cursorY;
	}

	private measureLegalFooterHeight(doc: PdfDoc, options: BuildPdfDocumentOptions): number {
		const { contentWidth } = PDF_LAYOUT;
		const legal = buildFrenchLegalFooter({
			kind: options.kind,
			company: options.company,
			organization: options.organization,
			document: options.document,
			expiryDate: options.expiryDate,
		});
		const pad = PDF_LAYOUT.padMd;
		const lineGap = 3;
		const textWidth = contentWidth - pad * 2;
		const titleSize = 6.5;
		const bodySize = 6.5;
		doc.font('Helvetica-Bold').fontSize(titleSize);
		let textHeight = pad;
		textHeight +=
			doc.heightOfString('Mentions légales et conditions contractuelles', { width: textWidth }) + 4;
		doc.font('Helvetica').fontSize(bodySize);
		textHeight += doc.heightOfString(legal.issuerLine, { width: textWidth, lineGap }) + 4;
		for (const p of legal.paragraphs) {
			textHeight += doc.heightOfString(p, { width: textWidth, lineGap }) + 3;
		}
		textHeight += 16;
		return textHeight + pad;
	}

	/** Bandeau légal calé en bas de page (position fixe, sans chevauchement). */
	private drawLegalFooterAt(
		doc: PdfDoc,
		options: BuildPdfDocumentOptions,
		bandTop: number,
	): void {
		const { marginX, contentWidth } = PDF_LAYOUT;
		const maxY = this.getPageMaxY(doc);
		const bandHeight = Math.min(this.measureLegalFooterHeight(doc, options), maxY - bandTop);
		if (bandHeight < 24) return;

		const legal = buildFrenchLegalFooter({
			kind: options.kind,
			company: options.company,
			organization: options.organization,
			document: options.document,
			expiryDate: options.expiryDate,
		});

		const pad = PDF_LAYOUT.padMd;
		const fontSize = 6.5;
		const lineGap = 3;
		const textWidth = contentWidth - pad * 2;

		doc.save();
		doc.rect(marginX, bandTop, contentWidth, bandHeight).fill(PDF_THEME.legalBg);
		doc.restore();

		doc.fontSize(fontSize).fillColor(PDF_THEME.navy).font('Helvetica-Bold');
		doc.text('Mentions légales et conditions contractuelles', marginX + pad, bandTop + pad, {
			width: textWidth,
		});

		let y = doc.y + 4;
		doc.font('Helvetica').fontSize(fontSize).fillColor(PDF_THEME.textDark);
		doc.text(legal.issuerLine, marginX + pad, y, { width: textWidth, lineGap });
		y = doc.y + 4;

		doc.fillColor(PDF_THEME.text);
		for (const paragraph of legal.paragraphs) {
			doc.text(paragraph, marginX + pad, y, {
				width: textWidth,
				lineGap,
				align: 'left',
			});
			y = doc.y + 3;
		}

		const pageLineY = Math.min(y + 8, bandTop + bandHeight - pad - 6);
		doc.fontSize(6).fillColor(PDF_THEME.textMuted);
		doc.text(`Page ${doc.page.number} — Document généré par Facturio`, marginX + pad, pageLineY, {
			width: textWidth,
			align: 'center',
			lineBreak: false,
		});

		doc.x = marginX;
		doc.y = bandTop + bandHeight;
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

	private formatCurrency(amount: unknown): string {
		return formatPdfCurrency(this.toNumber(amount));
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
	return formatPdfCurrency(n);
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
