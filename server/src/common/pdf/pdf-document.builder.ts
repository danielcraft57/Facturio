import * as fs from 'fs';
import { parseTagsJson } from '../document-folder.util';
import { formatPdfCurrency } from './pdf-currency.util';
import { dedupeRepeatedDescription } from './pdf-text.util';
import { getHeaderWaveImagePath } from './pdf-assets';
import { buildFrenchLegalFooter, formatPostalAddress } from './pdf-legal-mentions';
import { hasRenderableSignature, tryEmbedSignatureImage } from './pdf-signature.util';
import {
	PDF_LAYOUT,
	PDF_THEME,
	type PdfCompanyInfo,
	type PdfDocumentKind,
	type PdfTotals
} from './pdf-theme';
import {
	buildDevisTableRowPlans,
	drawQuoteLineDisplay,
	measureQuoteLineDisplayHeight,
	quoteLineUsesAlignedDeliverableRows,
} from './pdf-line-description.render';
import {
	buildEmitterParty,
	buildRecipientParty,
	drawPartyBlock,
} from './pdf-party-block';
import type { QuoteLineDisplay } from '../../products/product-quote-description.util';

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
	/** Filigrane discret (plan Free). */
	watermarkText?: string | null;
}

/**
 * Construit le contenu visuel d'une facture ou d'un devis (template corporate).
 */
export class PdfDocumentBuilder {
	private pageIndex = 1;
	/** Évite la récursion pageAdded → text → pageAdded sur le filigrane. */
	private drawingWatermark = false;

	constructor(private readonly logger?: { warn: (msg: string, err?: unknown) => void }) {}

	// Prisma peut renvoyer des Decimal (avec une méthode `toNumber()`).
	private toNumber(value: unknown): number {
		return Number((value as { toNumber?: () => number } | null | undefined)?.toNumber?.() ?? value ?? 0);
	}

	build(doc: PdfDoc, options: BuildPdfDocumentOptions): void {
		const { marginX, contentWidth } = PDF_LAYOUT;
		this.pageIndex = 1;
		const watermarkText = options.watermarkText?.trim() || null;
		doc.on('pageAdded', () => {
			this.pageIndex += 1;
			if (watermarkText && !this.drawingWatermark) {
				this.drawPlanWatermark(doc, watermarkText);
			}
		});

		const headerBottom = this.drawHeader(doc, options);
		doc.y = headerBottom + PDF_LAYOUT.padSm;

		this.drawPartiesSection(doc, options);
		this.drawDocumentMeta(doc, options);
		this.drawEngagementPage1Banner(doc, options);

		this.drawLinesTable(doc, options.lines, options.kind, options);
		doc.y += PDF_LAYOUT.sectionGap;
		this.drawTotals(doc, options.totals, options);

		const signatureValue =
			options.signature ?? options.organization?.signature ?? null;

		if (options.kind === 'devis') {
			this.drawDevisClosing(doc, options, signatureValue);
		} else {
			doc.y += PDF_LAYOUT.padLg;
			const hasSignature = hasRenderableSignature(signatureValue);
			const { blockY, footerBandTop, signatureHeight } = this.prepareClosingSection(
				doc,
				options,
				hasSignature,
			);

			if (hasSignature) {
				const leftWidth = contentWidth * 0.58;
				const rightX = marginX + leftWidth + 16;
				const rightWidth = contentWidth - leftWidth - 16;
				this.drawPaymentBlock(doc, options, marginX, blockY, leftWidth);
				this.drawSignatureBox(doc, rightX, blockY, rightWidth, signatureHeight, {
					date: options.signatureDate ?? options.date ?? new Date(),
					signature: signatureValue,
				});
			} else {
				this.drawPaymentBlock(doc, options, marginX, blockY, contentWidth);
			}

			doc.save();
			doc.strokeColor(PDF_THEME.border)
				.lineWidth(0.5)
				.moveTo(marginX, footerBandTop - 10)
				.lineTo(marginX + contentWidth, footerBandTop - 10)
				.stroke();
			doc.restore();

			this.drawLegalFooterAt(doc, options, footerBandTop);
		}

		if (watermarkText) {
			this.drawPlanWatermark(doc, watermarkText);
		}
	}

	/** Filigrane plan Free en bas de page. */
	private drawPlanWatermark(doc: PdfDoc, text: string): void {
		if (this.drawingWatermark) return;
		this.drawingWatermark = true;
		try {
			const { marginX, contentWidth } = PDF_LAYOUT;
			const pageHeight = doc.page?.height ?? 841.89;
			doc.save();
			doc.fontSize(8)
				.fillColor('#9CA3AF')
				.text(text, marginX, pageHeight - 42, {
					width: contentWidth,
					align: 'center',
					lineBreak: false,
				});
			doc.restore();
		} finally {
			this.drawingWatermark = false;
		}
	}

	/** Paiement + mentions légales en flux (évite une page 2 quasi vide). */
	private drawDevisClosing(
		doc: PdfDoc,
		options: BuildPdfDocumentOptions,
		signatureValue: string | null | undefined,
	): void {
		const { marginX, contentWidth } = PDF_LAYOUT;
		const hasSignature = hasRenderableSignature(signatureValue);
		const signatureHeight = hasSignature ? 88 : 0;
		const paymentHeight = this.estimatePaymentBlockHeight(doc, options);
		const legalHeight = this.measureLegalFooterHeight(doc, options);
		const bodyHeight =
			Math.max(paymentHeight, signatureHeight) + legalHeight + (hasSignature ? 28 : 20);

		doc.y += PDF_LAYOUT.padSm;
		const maxY = this.getPageMaxY(doc);
		if (doc.y + bodyHeight > maxY) {
			doc.addPage();
			doc.y = this.getContinuationPageStartY();
		}

		const blockY = doc.y;
		if (hasSignature) {
			const leftWidth = contentWidth * 0.58;
			const rightX = marginX + leftWidth + 16;
			const rightWidth = contentWidth - leftWidth - 16;
			this.drawPaymentBlock(doc, options, marginX, blockY, leftWidth);
			this.drawSignatureBox(doc, rightX, blockY, rightWidth, signatureHeight, {
				date: options.signatureDate ?? options.date ?? new Date(),
				signature: signatureValue,
			});
			doc.y = blockY + Math.max(paymentHeight, signatureHeight) + PDF_LAYOUT.padMd;
		} else {
			this.drawPaymentBlock(doc, options, marginX, blockY, contentWidth);
			doc.y = blockY + paymentHeight + PDF_LAYOUT.padSm;
		}

		doc.save();
		doc.strokeColor(PDF_THEME.border)
			.lineWidth(0.5)
			.moveTo(marginX, doc.y)
			.lineTo(marginX + contentWidth, doc.y)
			.stroke();
		doc.restore();
		doc.y += PDF_LAYOUT.padSm;

		this.drawLegalFooterInline(doc, options);
	}

	/** Réserve paiement + signature au-dessus du bandeau légal calé en bas de page. */
	private prepareClosingSection(
		doc: PdfDoc,
		options: BuildPdfDocumentOptions,
		hasSignature: boolean,
	): { blockY: number; footerBandTop: number; signatureHeight: number } {
		const signatureHeight = hasSignature ? 88 : 0;
		const footerHeight = this.measureLegalFooterHeight(doc, options);
		const paymentHeight = this.estimatePaymentBlockHeight(doc, options);
		const bodyHeight = Math.max(paymentHeight, signatureHeight) + (hasSignature ? 20 : 10);
		const maxY = this.getPageMaxY(doc);
		let footerBandTop = maxY - footerHeight;

		if (doc.y + bodyHeight > footerBandTop - 10) {
			doc.addPage();
			doc.y = this.getContinuationPageStartY();
			footerBandTop = maxY - footerHeight;
		}

		return { blockY: doc.y, footerBandTop, signatureHeight };
	}

	private getPageMaxY(doc: PdfDoc): number {
		const pageHeight = doc.page.height;
		const bottomMargin = doc.page.margins?.bottom ?? 50;
		return pageHeight - bottomMargin;
	}

	/** Position Y de départ sur les pages 2+ (marges PDFKit top=0, ne pas utiliser doc.page.margins.top). */
	private getContinuationPageStartY(): number {
		return PDF_LAYOUT.continuationPageTop;
	}

	private getPageContentBottom(doc: PdfDoc, footerReserve = 230): number {
		const pageHeight = doc.page.height;
		const bottomMargin = doc.page.margins?.bottom ?? 50;
		return pageHeight - bottomMargin - footerReserve;
	}

	private drawHeader(doc: PdfDoc, options: BuildPdfDocumentOptions): number {
		const { pageWidth, headerHeight, marginX, contentWidth } = PDF_LAYOUT;
		const splitKind = this.resolveSplitInvoiceKind(options);
		const label =
			splitKind === 'deposit'
				? "Facture d'acompte"
				: splitKind === 'remainder'
					? 'Facture de solde'
					: splitKind === 'installment'
						? 'Facture échéancier'
						: options.kind === 'facture'
							? 'Facture'
							: 'Devis';
		const title = `${label} n° ${options.number}`;

		this.drawHeaderWaves(doc, pageWidth, headerHeight);
		this.drawHeaderBackground(doc, pageWidth, headerHeight);

		doc.fontSize(splitKind ? 16 : 17)
			.fillColor(PDF_THEME.white)
			.font('Helvetica-Bold')
			.text(title, marginX, 30, { width: contentWidth, align: 'center', lineGap: 2 });

		let metaY = 52;
		const quoteRef = options.document?.sourceQuoteNumber as string | undefined;
		if (splitKind === 'deposit') {
			doc.fontSize(8.5)
				.fillColor(PDF_THEME.white)
				.font('Helvetica')
				.text(
					quoteRef ? `10 % TTC du devis n° ${quoteRef}` : '10 % TTC du devis accepté',
					marginX,
					metaY,
					{ width: contentWidth, align: 'center', lineGap: 2 },
				);
			metaY += 14;
		} else if (splitKind === 'installment') {
			const schedule = options.document?.installmentSchedule as unknown[] | undefined;
			const count = schedule?.length;
			const countLabel =
				count != null && count > 0
					? `Solde en ${count} mensualité${count > 1 ? 's' : ''}`
					: 'Solde échelonné';
			doc.fontSize(8.5)
				.fillColor(PDF_THEME.white)
				.font('Helvetica')
				.text(
					quoteRef ? `${countLabel} — devis n° ${quoteRef}` : `${countLabel} — devis accepté`,
					marginX,
					metaY,
					{ width: contentWidth, align: 'center', lineGap: 2 },
				);
			metaY += 14;
		} else if (splitKind === 'remainder') {
			doc.fontSize(8.5)
				.fillColor(PDF_THEME.white)
				.font('Helvetica')
				.text(
					quoteRef ? `Solde après acompte — devis n° ${quoteRef}` : 'Solde après acompte (devis accepté)',
					marginX,
					metaY,
					{ width: contentWidth, align: 'center', lineGap: 2 },
				);
			metaY += 14;
		}

		if (options.date) {
			doc.save();
			doc.opacity(0.9);
			doc.fontSize(9)
				.fillColor(PDF_THEME.white)
				.font('Helvetica')
				.text(
					`Émis le ${new Date(options.date).toLocaleDateString('fr-FR')}`,
					marginX,
					metaY,
					{ width: contentWidth, align: 'center', lineGap: 2 },
				);
			doc.opacity(1);
			doc.restore();
		}

		return PDF_LAYOUT.headerContentBottom;
	}

	/** Type de facture liée à un devis (acompte, solde, échéancier). */
	private resolveSplitInvoiceKind(
		options: BuildPdfDocumentOptions,
	): 'deposit' | 'remainder' | 'installment' | null {
		if (options.kind !== 'facture') return null;
		const tags = parseTagsJson(options.document?.tags ?? null);
		if (tags.includes('ACOMPTE_10')) return 'deposit';
		if (tags.includes('SOLDE_APRES_ACOMPTE')) return 'remainder';
		if (tags.includes('ECHEANCIER')) return 'installment';
		return null;
	}

	/**
	 * Bandeau page 1 : rappelle le montant total de la prestation (devis) et le rôle de cette facture.
	 * Bonne pratique fiscale / art. 289 CGI — la facture d'acompte doit être clairement identifiable.
	 */
	private drawEngagementPage1Banner(doc: PdfDoc, options: BuildPdfDocumentOptions): void {
		const breakdown = options.document?.engagementBreakdown as
			| { contractTotal?: number; depositAmount?: number; remainderAmount?: number }
			| undefined;
		const splitKind = this.resolveSplitInvoiceKind(options);
		if (!breakdown || !splitKind || !Number.isFinite(breakdown.contractTotal)) return;

		const { marginX, contentWidth } = PDF_LAYOUT;
		const contractTotal = Number(breakdown.contractTotal);
		const depositAmount = Number(breakdown.depositAmount ?? 0);
		const invoiceTotal = Number(options.totals?.total ?? options.document?.total ?? 0);
		const quoteRef = options.document?.sourceQuoteNumber as string | undefined;
		const bannerTop = doc.y + PDF_LAYOUT.padSm;
		const pad = 12;
		const innerW = contentWidth - pad * 2;
		const labelW = innerW * 0.62;
		const amountW = innerW - labelW;

		let rowCount = 2;
		if (splitKind === 'remainder') rowCount = 3;
		if (splitKind === 'installment') rowCount = depositAmount > 0 ? 3 : 2;
		const footnoteLines =
			splitKind === 'deposit' || splitKind === 'installment' || splitKind === 'remainder' ? 14 : 0;
		const bannerH = 36 + rowCount * 16 + footnoteLines + (splitKind === 'deposit' ? 4 : 8);

		doc.save();
		doc.roundedRect(marginX, bannerTop, contentWidth, bannerH, 5).fillAndStroke('#f8fafc', PDF_THEME.navyMid);
		doc.restore();

		let cursorY = bannerTop + pad;
		doc.font('Helvetica-Bold').fontSize(8).fillColor(PDF_THEME.navy);
		const bannerTitle = quoteRef
			? `Prestation — devis n° ${quoteRef} accepté`
			: 'Prestation — devis accepté';
		doc.text(bannerTitle, marginX + pad, cursorY, { width: innerW });
		cursorY += 14;

		const drawRow = (label: string, amount: number, bold = false, muted = false) => {
			doc
				.font(bold ? 'Helvetica-Bold' : 'Helvetica')
				.fontSize(bold ? 9 : 8.5)
				.fillColor(muted ? PDF_THEME.textMuted : PDF_THEME.textDark);
			doc.text(label, marginX + pad, cursorY, { width: labelW });
			doc.text(this.formatCurrency(amount), marginX + pad + labelW, cursorY, {
				width: amountW,
				align: 'right',
			});
			cursorY += 16;
		};

		drawRow('Montant total de la prestation (TTC)', contractTotal, true);

		if (splitKind === 'deposit') {
			drawRow('Dont acompte sur cette facture (10 % TTC)', invoiceTotal, true);
			doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
			doc.text(
				'Les lignes ci-dessous reprennent la prestation au prorata de l\'acompte (10 %). Le solde sera facturé séparément.',
				marginX + pad,
				cursorY,
				{ width: innerW, lineGap: 1 },
			);
			cursorY = doc.y + 4;
		} else if (splitKind === 'remainder') {
			drawRow('Acompte déjà réglé (10 % TTC)', depositAmount, false, true);
			drawRow('Solde sur cette facture (TTC)', invoiceTotal, true);
			doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
			doc.text(
				'Les lignes ci-dessous reprennent la prestation au prorata du solde (90 % HT).',
				marginX + pad,
				cursorY,
				{ width: innerW, lineGap: 1 },
			);
			cursorY = doc.y + 4;
		} else if (splitKind === 'installment') {
			if (depositAmount > 0) {
				drawRow('Acompte déjà réglé (10 % TTC)', depositAmount, false, true);
			}
			drawRow('Solde échelonné sur cette facture (TTC)', invoiceTotal, true);
			doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
			doc.text(
				depositAmount > 0
					? 'Lignes au prorata du solde (90 % HT). Règlement mensualité par mensualité — détail page suivante.'
					: 'Lignes au prorata de la prestation. Règlement mensualité par mensualité — détail page suivante.',
				marginX + pad,
				cursorY,
				{ width: innerW, lineGap: 1 },
			);
			cursorY = doc.y + 4;
		}

		doc.y = bannerTop + bannerH + PDF_LAYOUT.sectionGap;
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
		doc.moveTo(0, 0).lineTo(pageWidth, 0).lineTo(pageWidth, h * 0.55);
		doc.bezierCurveTo(pageWidth * 0.78, h * 1.02, pageWidth * 0.38, h * 0.32, 0, h * 0.68);
		doc.lineTo(0, 0).fill(PDF_THEME.navy);

		doc.moveTo(0, h * 0.48)
			.bezierCurveTo(pageWidth * 0.22, h * 0.92, pageWidth * 0.58, h * 0.38, pageWidth, h * 0.62)
			.lineTo(pageWidth, h * 0.42)
			.bezierCurveTo(pageWidth * 0.5, h * 0.15, pageWidth * 0.18, h * 0.52, 0, h * 0.34)
			.closePath()
			.fill(PDF_THEME.navyMid);
		doc.restore();
	}

	/** Émetteur (gauche) + client / facturé à (droite) — commun devis & facture. */
	private drawPartiesSection(doc: PdfDoc, options: BuildPdfDocumentOptions): void {
		const { marginX, contentWidth } = PDF_LAYOUT;
		const colGap = 24;
		const colW = (contentWidth - colGap) / 2;
		const startY = doc.y;

		const emitter = buildEmitterParty(options.company, options.kind);
		const recipient = buildRecipientParty(options.client, options.kind);

		const embedLogo = (logo: string, x: number, y: number, size: number) =>
			this.tryEmbedLogo(doc, logo, x, y, size);

		const leftH = drawPartyBlock(doc, emitter, marginX, startY, colW, embedLogo);
		const rightH = recipient
			? drawPartyBlock(doc, recipient, marginX + colW + colGap, startY, colW)
			: 0;

		doc.x = marginX;
		doc.y = startY + Math.max(leftH, rightH) + PDF_LAYOUT.sectionGap;
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

	private drawDocumentMeta(doc: PdfDoc, options: BuildPdfDocumentOptions): void {
		const { marginX, contentWidth } = PDF_LAYOUT;
		const items: string[] = [];

		if (options.kind === 'facture' && options.document?.dueDate) {
			items.push(
				`Date d'échéance : ${new Date(options.document.dueDate).toLocaleDateString('fr-FR')}`
			);
		}
		if (options.kind === 'devis' && options.expiryDate) {
			items.push(
				`Valable jusqu'au ${new Date(options.expiryDate).toLocaleDateString('fr-FR')}`,
			);
		}
		if (!items.length) return;

		doc.fontSize(8)
			.fillColor(PDF_THEME.textMuted)
			.font('Helvetica')
			.text(items.join('   ·   '), marginX, doc.y + PDF_LAYOUT.padSm, {
				width: contentWidth,
				align: 'center',
				lineGap: 2,
			});
		doc.y += PDF_LAYOUT.sectionGap;
	}

	private drawLinesTable(
		doc: PdfDoc,
		lines: any[],
		kind: PdfDocumentKind = 'facture',
		options?: BuildPdfDocumentOptions,
	): void {
		if (!lines.length) return;

		const {
			marginX,
			contentWidth,
			tableHeaderHeight,
			lineHeight,
			tableCellPadX,
			tableCellPadY
		} = PDF_LAYOUT;
		const colDescW = kind === 'devis' ? 292 : 258;
		const colUnitW = kind === 'devis' ? 96 : 108;
		const colTotalW = contentWidth - colDescW - colUnitW - tableCellPadX * 2;
		const cols = {
			desc: marginX + tableCellPadX,
			unit: marginX + tableCellPadX + colDescW,
			total: marginX + tableCellPadX + colDescW + colUnitW,
		};

		let tableTop = doc.y;
		let rowY = this.drawTableHeader(doc, tableTop, cols, {
			colDescW,
			colUnitW,
			colTotalW,
			tableHeaderHeight,
			tableCellPadY,
			contentWidth,
			marginX,
		});
		doc.font('Helvetica').fontSize(9);
		const pageBottom = this.getPageContentBottom(doc, 72);

		let visualRowIndex = 0;
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const quoteDisplay = kind === 'devis' ? (line.quoteLineDisplay as QuoteLineDisplay | undefined) : undefined;
			const description = dedupeRepeatedDescription(line.description || '');
			const useAlignedDeliverables =
				kind === 'devis' && quoteDisplay && quoteLineUsesAlignedDeliverableRows(quoteDisplay);

			const rowPlans = useAlignedDeliverables
				? buildDevisTableRowPlans(doc, quoteDisplay, colDescW, tableCellPadY, lineHeight)
				: null;

			const segments = rowPlans ?? [
				{
					height: Math.max(
						lineHeight,
						(quoteDisplay
							? measureQuoteLineDisplayHeight(doc, quoteDisplay, colDescW, tableCellPadY)
							: doc.heightOfString(description, { width: colDescW })) + tableCellPadY * 2,
					),
					unitPrice: this.toNumber(line.unitPrice),
					lineTotal: (() => {
						const unitPrice = this.toNumber(line.unitPrice);
						const fromFields = unitPrice * 1;
						const fromTotal = this.toNumber(line.total);
						return Number.isFinite(fromFields) ? fromFields : fromTotal;
					})(),
					drawDescription: (d: PdfDoc, x: number, y: number, w: number) => {
						if (quoteDisplay) {
							drawQuoteLineDisplay(d, quoteDisplay, x, y, w);
						} else {
							d.text(description, x, y, { width: w });
						}
					},
				},
			];

			for (const plan of segments) {
				const rowH = plan.height;

				if (rowY + rowH > pageBottom) {
					doc.strokeColor(PDF_THEME.border)
						.lineWidth(0.75)
						.rect(marginX, tableTop, contentWidth, rowY - tableTop)
						.stroke();
					doc.addPage();
					tableTop = this.getContinuationPageStartY();
					rowY = this.drawTableHeader(doc, tableTop, cols, {
						colDescW,
						colUnitW,
						colTotalW,
						tableHeaderHeight,
						tableCellPadY,
						contentWidth,
						marginX,
					});
					doc.font('Helvetica').fontSize(9);
				}

				if (visualRowIndex % 2 === 0) {
					doc.rect(marginX, rowY, contentWidth, rowH).fill(PDF_THEME.rowAlt);
				}
				const cellY = rowY + tableCellPadY;
				const priceY = rowY + (rowH - 11) / 2;
				doc.fillColor(PDF_THEME.textDark);
				plan.drawDescription(doc, cols.desc, cellY, colDescW);

				if (plan.unitPrice != null && Number.isFinite(plan.unitPrice)) {
					const lineTotal = plan.lineTotal ?? plan.unitPrice;
					doc.text(this.formatCurrency(plan.unitPrice), cols.unit, priceY, {
						width: colUnitW,
						align: 'right',
						lineBreak: false,
					}).text(this.formatCurrency(lineTotal), cols.total, priceY, {
						width: colTotalW,
						align: 'right',
						lineBreak: false,
					});
				}

				rowY += rowH;
				visualRowIndex += 1;
			}
		}

		doc.strokeColor(PDF_THEME.border)
			.lineWidth(0.75)
			.rect(marginX, tableTop, contentWidth, rowY - tableTop)
			.stroke();

		const hasRichLines = lines.some((line) => line.quoteLineDisplay);
		if (!hasRichLines) {
			const splitKind = options ? this.resolveSplitInvoiceKind(options) : null;
			let footnote = 'Montants des lignes exprimés en HT (hors TVA).';
			if (splitKind === 'deposit') {
				footnote =
					'Montants HT au prorata de l\'acompte (10 % du devis). Le total TTC ci-contre inclut la TVA.';
			} else if (splitKind === 'installment' || splitKind === 'remainder') {
				const breakdown = options?.document?.engagementBreakdown as
					| { depositAmount?: number }
					| undefined;
				const hasDeposit = Number(breakdown?.depositAmount ?? 0) > 0.01;
				footnote = hasDeposit
					? 'Montants HT au prorata du solde (90 % du devis). Le total TTC ci-contre inclut la TVA.'
					: 'Montants des lignes exprimés en HT (hors TVA). Le total TTC ci-contre inclut la TVA.';
			}
			doc.font('Helvetica')
				.fontSize(7.5)
				.fillColor(PDF_THEME.textMuted)
				.text(footnote, marginX, rowY + 4, {
					width: contentWidth,
					align: 'left',
				});
			doc.y = rowY + 20;
		} else {
			doc.y = rowY + 8;
		}
	}

	private drawTableHeader(
		doc: PdfDoc,
		tableTop: number,
		cols: { desc: number; unit: number; total: number },
		layout: {
			colDescW: number;
			colUnitW: number;
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
		doc.strokeColor(PDF_THEME.highlight).stroke();
		doc.restore();

		const headerTextY = tableTop + layout.tableCellPadY;
		doc.fontSize(9)
			.fillColor(PDF_THEME.navy)
			.font('Helvetica-Bold')
			.text('Description', cols.desc, headerTextY, { width: layout.colDescW })
			.text('Prix unit. HT', cols.unit, headerTextY, { width: layout.colUnitW, align: 'right' })
			.text('Total HT', cols.total, headerTextY, {
				width: layout.colTotalW,
				align: 'right',
			});
		return tableTop + layout.tableHeaderHeight;
	}

	private estimatePaymentBlockHeight(doc: PdfDoc, options: BuildPdfDocumentOptions): number {
		const tags = parseTagsJson(options.document?.tags ?? null);
		const isDeposit = tags.includes('ACOMPTE_10');
		const isInstallment = tags.includes('ECHEANCIER');
		const schedule = options.document?.installmentSchedule as
			| { sequence: number; amount: number; dueDate: Date | string; status: string }[]
			| undefined;
		const hasSchedule = Boolean(schedule?.length);
		const breakdown = options.document?.engagementBreakdown as
			| { contractTotal?: number; depositAmount?: number; remainderAmount?: number }
			| undefined;
		const hasBreakdown = Boolean(breakdown && Number.isFinite(breakdown.contractTotal));

		if (hasBreakdown) {
			let h = 28 + 8;
			if (isDeposit) {
				h += hasSchedule ? 118 : 98;
				if (hasSchedule && schedule) {
					h += 16 + 20 + schedule.length * 22 + 22;
				}
			} else if (isInstallment) {
				h += 118;
				if (hasSchedule && schedule) {
					h += 16 + 20 + schedule.length * 22 + 22 + 52;
				}
			} else {
				h += 15 * 3 + 8;
				if (hasSchedule && schedule) {
					h += 16 + 20 + schedule.length * 22 + 22 + 52;
				} else {
					h += 38;
				}
			}
			if (options.document?.paymentNote) {
				h +=
					doc.heightOfString(String(options.document.paymentNote), { width: 260, lineGap: 3 }) + 8;
			}
			if (process.env.COMPANY_IBAN) h += 14;
			return h;
		}

		if (hasSchedule && schedule) {
			return 28 + 16 + 20 + schedule.length * 22 + 22 + 52 + 40;
		}

		let h = 28;
		if (options.document?.paymentNote) {
			h += doc.heightOfString(String(options.document.paymentNote), { width: 260, lineGap: 3 }) + 8;
		} else {
			h += 36;
		}
		return h;
	}

	private drawTotals(doc: PdfDoc, totals: PdfTotals, options?: BuildPdfDocumentOptions): void {
		const { marginX, contentWidth } = PDF_LAYOUT;
		const boxWidth = 210;
		const boxX = marginX + contentWidth - boxWidth;
		const startY = doc.y;
		const rowH = 18;
		const splitKind = options ? this.resolveSplitInvoiceKind(options) : null;

		const taxRate =
			totals.subtotal > 0 ? Math.round((totals.tax / totals.subtotal) * 100) : 0;

		doc.fontSize(9).fillColor(PDF_THEME.text).font('Helvetica');
		const subtotalLabel = splitKind ? 'Sous-total HT (cette facture)' : 'Sous-total';
		doc.text(subtotalLabel, boxX, startY, { width: 100 })
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
		const netLabel =
			splitKind === 'deposit'
				? 'Total TTC — acompte'
				: splitKind === 'remainder'
					? 'Total TTC — solde'
					: splitKind === 'installment'
						? 'Total TTC — échéancier'
						: hasCredit
							? 'Net à payer'
							: 'Total TTC';
		const netAmount = hasCredit
			? Number(totals.netDue ?? Math.max(0, totals.total - creditApplied))
			: totals.total;
		doc.roundedRect(boxX, barY, boxWidth, barH, 15).fill(PDF_THEME.navy);
		const totalTextY = barY + (barH - 11) / 2;
		doc.fontSize(11)
			.fillColor(PDF_THEME.white)
			.font('Helvetica-Bold')
			.text(netLabel, boxX + 14, totalTextY, { width: 80, lineBreak: false })
			.text(this.formatCurrency(netAmount), boxX + 90, totalTextY, {
				width: boxWidth - 100,
				align: 'right',
				lineBreak: false,
			});

		doc.y = barY + barH + 8;
	}

	private formatInstallmentStatusLabel(status: string): string {
		switch (status) {
			case 'PAID':
				return 'Réglée';
			case 'PENDING':
				return 'À régler';
			case 'SCHEDULED':
				return 'Programmée';
			case 'CANCELLED':
				return 'Annulée';
			default:
				return status;
		}
	}

	/**
	 * Tableau d'échéancier lisible (mensualités, dates, montants, statuts).
	 *
	 * @returns Position Y après le bloc
	 */
	private drawInstallmentScheduleSection(
		doc: PdfDoc,
		schedule: { sequence: number; amount: number; dueDate: Date | string; status: string }[],
		x: number,
		y: number,
		width: number,
		sectionOptions?: { title?: string; footnote?: string; preview?: boolean },
	): number {
		const totalCount = schedule.length;
		const preview = sectionOptions?.preview === true;
		let cursorY = y;

		doc.font('Helvetica-Bold').fontSize(10).fillColor(PDF_THEME.navy);
		doc.text(sectionOptions?.title ?? 'Échéancier de paiement', x, cursorY, { width });
		cursorY = doc.y + 6;

		const colN = width * 0.14;
		const colDate = width * 0.28;
		const colAmount = width * 0.28;
		const colStatus = width - colN - colDate - colAmount;
		const rowH = 22;
		const headerH = 20;

		doc.save();
		doc.roundedRect(x, cursorY, width, headerH, 3).fill(PDF_THEME.navyMid);
		doc.font('Helvetica-Bold').fontSize(7.5).fillColor(PDF_THEME.white);
		doc.text('N°', x + 6, cursorY + 6, { width: colN - 8, lineBreak: false });
		doc.text('Date', x + colN, cursorY + 6, { width: colDate - 4, lineBreak: false });
		doc.text('Montant TTC', x + colN + colDate, cursorY + 6, {
			width: colAmount - 4,
			align: 'right',
			lineBreak: false,
		});
		doc.text('Statut', x + colN + colDate + colAmount, cursorY + 6, {
			width: colStatus - 6,
			align: 'right',
			lineBreak: false,
		});
		doc.restore();
		cursorY += headerH;

		for (let i = 0; i < schedule.length; i++) {
			const row = schedule[i];
			const isPending = !preview && row.status === 'PENDING';
			const isPaid = row.status === 'PAID';
			const bg = isPending ? '#eff6ff' : i % 2 === 1 ? PDF_THEME.rowAlt : PDF_THEME.white;

			doc.save();
			doc.rect(x, cursorY, width, rowH).fill(bg);
			if (isPending) {
				doc.rect(x, cursorY, 3, rowH).fill(PDF_THEME.accent);
			}
			doc.restore();

			const dueFr = new Date(row.dueDate).toLocaleDateString('fr-FR');
			const statusLabel = this.formatInstallmentStatusLabel(row.status);
			const statusColor = isPaid
				? '#15803d'
				: isPending
					? PDF_THEME.accent
					: PDF_THEME.textMuted;

			doc.font(isPending ? 'Helvetica-Bold' : 'Helvetica')
				.fontSize(8.5)
				.fillColor(PDF_THEME.textDark);
			doc.text(`${row.sequence}/${totalCount}`, x + 6, cursorY + 7, {
				width: colN - 8,
				lineBreak: false,
			});
			doc.text(dueFr, x + colN, cursorY + 7, { width: colDate - 4, lineBreak: false });
			doc.text(this.formatCurrency(row.amount), x + colN + colDate, cursorY + 7, {
				width: colAmount - 4,
				align: 'right',
				lineBreak: false,
			});
			doc.font('Helvetica-Bold')
				.fontSize(7.5)
				.fillColor(statusColor);
			doc.text(statusLabel, x + colN + colDate + colAmount, cursorY + 7, {
				width: colStatus - 6,
				align: 'right',
				lineBreak: false,
			});

			cursorY += rowH;
		}

		const scheduleSum = schedule.reduce((s, r) => s + Number(r.amount), 0);
		cursorY += 4;
		doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
		doc.text(
			sectionOptions?.footnote ??
				`Total des mensualités : ${this.formatCurrency(scheduleSum)} · Le paiement en ligne porte sur la mensualité « À régler ».`,
			x,
			cursorY,
			{ width, lineGap: 2 },
		);
		return doc.y + PDF_LAYOUT.padSm;
	}

	/**
	 * Encadré « montant à régler maintenant » pour la prochaine mensualité active.
	 */
	private drawInstallmentDueNowBox(
		doc: PdfDoc,
		schedule: { sequence: number; amount: number; dueDate: Date | string; status: string }[],
		invoiceBalance: number,
		x: number,
		y: number,
		width: number,
	): number {
		const pending = schedule.find((r) => r.status === 'PENDING');
		if (!pending) {
			const allPaid = schedule.every((r) => r.status === 'PAID');
			if (allPaid) {
				doc.font('Helvetica').fontSize(8.5).fillColor('#15803d');
				doc.text('Toutes les mensualités sont réglées.', x, y, { width });
				return doc.y + PDF_LAYOUT.padSm;
			}
			return y;
		}

		const totalCount = schedule.length;
		const dueFr = new Date(pending.dueDate).toLocaleDateString('fr-FR');
		const boxH = 44;
		let cursorY = y + 4;

		doc.roundedRect(x, cursorY, width, boxH, 4).fillAndStroke('#eff6ff', PDF_THEME.accent);
		doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
		doc.text(`À régler maintenant — Mensualité ${pending.sequence}/${totalCount}`, x + 10, cursorY + 6, {
			width: width - 20,
		});
		doc.font('Helvetica-Bold').fontSize(13).fillColor(PDF_THEME.navy);
		doc.text(this.formatCurrency(pending.amount), x + 10, cursorY + 18, {
			width: width - 20,
			align: 'right',
		});
		doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
		doc.text(
			`Échéance le ${dueFr} · Solde restant sur la facture : ${this.formatCurrency(invoiceBalance)}`,
			x + 10,
			cursorY + 32,
			{ width: width - 20 },
		);
		return cursorY + boxH + PDF_LAYOUT.padSm;
	}

	/**
	 * Synthèse visuelle acompte / solde / total devis (facture d'acompte).
	 */
	private drawEngagementOverviewCard(
		doc: PdfDoc,
		x: number,
		y: number,
		width: number,
		params: {
			contractTotal: number;
			depositAmount: number;
			remainder: number;
			invoiceTotal: number;
			hasSchedule: boolean;
			scheduleCount?: number;
		},
	): number {
		const { contractTotal, depositAmount, remainder, invoiceTotal, hasSchedule, scheduleCount } =
			params;
		const pad = 12;
		const innerW = width - pad * 2;
		const cardTop = y;
		let cursorY = cardTop + pad;

		doc.save();
		doc.roundedRect(x, cardTop, width, 4, 2).fill(PDF_THEME.navy);
		doc.restore();

		doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
		doc.text('Prix total du devis (TTC)', x + pad, cursorY, { width: innerW * 0.62 });
		doc.font('Helvetica-Bold').fontSize(12).fillColor(PDF_THEME.navy);
		doc.text(this.formatCurrency(contractTotal), x + pad + innerW * 0.55, cursorY - 1, {
			width: innerW * 0.45,
			align: 'right',
		});
		cursorY += 22;

		doc.save();
		doc.strokeColor(PDF_THEME.border)
			.lineWidth(0.5)
			.moveTo(x + pad, cursorY)
			.lineTo(x + width - pad, cursorY)
			.stroke();
		doc.restore();
		cursorY += 10;

		const nowBoxH = 36;
		doc.roundedRect(x + pad, cursorY, innerW, nowBoxH, 4).fillAndStroke('#eff6ff', PDF_THEME.accent);
		doc.font('Helvetica-Bold').fontSize(8).fillColor(PDF_THEME.navy);
		doc.text('1. À payer maintenant — acompte 10 % (cette facture)', x + pad + 10, cursorY + 7, {
			width: innerW - 20,
		});
		doc.font('Helvetica-Bold').fontSize(14).fillColor(PDF_THEME.accent);
		doc.text(this.formatCurrency(invoiceTotal), x + pad + 10, cursorY + 18, {
			width: innerW - 20,
			align: 'right',
		});
		cursorY += nowBoxH + 10;

		doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PDF_THEME.textDark);
		doc.text('2. Après l\'acompte', x + pad, cursorY, { width: innerW * 0.62 });
		doc.text(this.formatCurrency(remainder), x + pad + innerW * 0.55, cursorY, {
			width: innerW * 0.45,
			align: 'right',
		});
		cursorY += 13;

		const afterHint = hasSchedule
			? scheduleCount != null && scheduleCount > 0
				? `Réparti en ${scheduleCount} mensualité${scheduleCount > 1 ? 's' : ''} — facture échéancier séparée`
				: 'Facture échéancier séparée'
			: 'Facturé sur la facture de solde, après livraison';
		doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
		doc.text(afterHint, x + pad, cursorY, { width: innerW, lineGap: 1 });
		cursorY = doc.y + 8;

		doc.save();
		doc.roundedRect(x + pad, cursorY, innerW, 18, 3).fill('#f8fafc');
		doc.restore();
		doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
		doc.text(
			`${this.formatCurrency(contractTotal)} = ${this.formatCurrency(depositAmount)} (acompte) + ${this.formatCurrency(remainder)} (suite)`,
			x + pad + 6,
			cursorY + 5,
			{ width: innerW - 12, align: 'center' },
		);
		cursorY += 26;

		doc.save();
		doc.roundedRect(x, cardTop, width, cursorY - cardTop, 5)
			.strokeColor(PDF_THEME.border)
			.lineWidth(0.75)
			.stroke();
		doc.restore();

		return cursorY + PDF_LAYOUT.padSm;
	}

	/**
	 * Synthèse visuelle pour facture échéancier (ECH) — page 2.
	 */
	private drawInstallmentOverviewCard(
		doc: PdfDoc,
		x: number,
		y: number,
		width: number,
		params: {
			contractTotal: number;
			depositAmount: number;
			remainder: number;
			invoiceTotal: number;
			scheduleCount?: number;
		},
	): number {
		const { contractTotal, depositAmount, remainder, invoiceTotal, scheduleCount } = params;
		const pad = 12;
		const innerW = width - pad * 2;
		const cardTop = y;
		let cursorY = cardTop + pad;

		doc.save();
		doc.roundedRect(x, cardTop, width, 4, 2).fill(PDF_THEME.navy);
		doc.restore();

		doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
		doc.text('Prix total du devis (TTC)', x + pad, cursorY, { width: innerW * 0.62 });
		doc.font('Helvetica-Bold').fontSize(12).fillColor(PDF_THEME.navy);
		doc.text(this.formatCurrency(contractTotal), x + pad + innerW * 0.55, cursorY - 1, {
			width: innerW * 0.45,
			align: 'right',
		});
		cursorY += 22;

		doc.save();
		doc.strokeColor(PDF_THEME.border)
			.lineWidth(0.5)
			.moveTo(x + pad, cursorY)
			.lineTo(x + width - pad, cursorY)
			.stroke();
		doc.restore();
		cursorY += 10;

		if (depositAmount > 0.01) {
			doc.font('Helvetica').fontSize(8.5).fillColor(PDF_THEME.textMuted);
			doc.text('Acompte déjà réglé (10 % TTC)', x + pad, cursorY, { width: innerW * 0.62 });
			doc.text(this.formatCurrency(depositAmount), x + pad + innerW * 0.55, cursorY, {
				width: innerW * 0.45,
				align: 'right',
			});
			cursorY += 16;
		}

		const boxH = 40;
		doc.roundedRect(x + pad, cursorY, innerW, boxH, 4).fillAndStroke('#eff6ff', PDF_THEME.accent);
		const scheduleLabel =
			scheduleCount != null && scheduleCount > 0
				? `Solde sur cette facture — ${scheduleCount} mensualité${scheduleCount > 1 ? 's' : ''} (TTC)`
				: 'Solde échelonné sur cette facture (TTC)';
		doc.font('Helvetica-Bold').fontSize(8).fillColor(PDF_THEME.navy);
		doc.text(scheduleLabel, x + pad + 10, cursorY + 7, { width: innerW - 20 });
		doc.font('Helvetica-Bold').fontSize(14).fillColor(PDF_THEME.accent);
		doc.text(this.formatCurrency(invoiceTotal), x + pad + 10, cursorY + 20, {
			width: innerW - 20,
			align: 'right',
		});
		cursorY += boxH + 10;

		doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
		doc.text(
			'Vous réglez une mensualité à la fois (voir tableau ci-dessous). Les montants TTC incluent la TVA.',
			x + pad,
			cursorY,
			{ width: innerW, lineGap: 1 },
		);
		cursorY = doc.y + 8;

		doc.save();
		doc.roundedRect(x + pad, cursorY, innerW, 18, 3).fill('#f8fafc');
		doc.restore();
		const formulaLeft = depositAmount > 0.01 ? depositAmount : 0;
		const formulaRight = remainder > 0 ? remainder : invoiceTotal;
		doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
		doc.text(
			depositAmount > 0.01
				? `${this.formatCurrency(contractTotal)} = ${this.formatCurrency(formulaLeft)} (acompte) + ${this.formatCurrency(formulaRight)} (mensualités)`
				: `${this.formatCurrency(contractTotal)} = ${this.formatCurrency(invoiceTotal)} (mensualités)`,
			x + pad + 6,
			cursorY + 5,
			{ width: innerW - 12, align: 'center' },
		);
		cursorY += 26;

		doc.save();
		doc.roundedRect(x, cardTop, width, cursorY - cardTop, 5)
			.strokeColor(PDF_THEME.border)
			.lineWidth(0.75)
			.stroke();
		doc.restore();

		return cursorY + PDF_LAYOUT.padSm;
	}

	/** Encadré « montant de cette facture » (acompte ou solde). */
	private drawThisInvoiceAmountBox(
		doc: PdfDoc,
		amount: number,
		x: number,
		y: number,
		width: number,
		label = 'Montant de cette facture',
	): number {
		const boxH = 30;
		let cursorY = y + 4;
		doc.roundedRect(x, cursorY, width, boxH, 4).fillAndStroke('#f8fafc', PDF_THEME.navy);
		doc.font('Helvetica').fontSize(7.5).fillColor(PDF_THEME.textMuted);
		doc.text(label, x + 8, cursorY + 5, { width: width - 16 });
		doc.font('Helvetica-Bold').fontSize(11).fillColor(PDF_THEME.navy);
		doc.text(this.formatCurrency(amount), x + 8, cursorY + 14, {
			width: width - 16,
			align: 'right',
		});
		return cursorY + boxH + 8;
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
		const isInstallment = tags.includes('ECHEANCIER');
		const schedule = options.document?.installmentSchedule as
			| { sequence: number; amount: number; dueDate: Date | string; status: string }[]
			| undefined;
		const hasSchedule = Boolean(schedule?.length);
		const breakdown = options.document?.engagementBreakdown as
			| { contractTotal?: number; depositAmount?: number; remainderAmount?: number }
			| undefined;
		const hasBreakdown = Boolean(breakdown && Number.isFinite(breakdown.contractTotal));
		const invoiceTotal = Number(options.totals?.total ?? options.document?.total ?? 0);
		const invoiceBalance = Number(
			options.document?.balance ?? options.totals?.netDue ?? invoiceTotal,
		);

		doc.fontSize(9).fillColor(PDF_THEME.navy).font('Helvetica-Bold');
		const blockTitle =
			(isDeposit || isInstallment) && hasBreakdown
				? 'Comprendre votre paiement'
				: hasSchedule && isInstallment
					? 'Paiement en plusieurs fois'
					: hasBreakdown
						? 'Récapitulatif du devis'
						: 'Paiement';
		doc.text(blockTitle, x, y, { width });
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

			if (isDeposit) {
				cursorY = this.drawEngagementOverviewCard(doc, x, cursorY, width, {
					contractTotal: totalContract,
					depositAmount,
					remainder,
					invoiceTotal,
					hasSchedule,
					scheduleCount: schedule?.length,
				});

				if (hasSchedule && schedule) {
					const scheduleSum = schedule.reduce((s, r) => s + Number(r.amount), 0);
					cursorY = this.drawInstallmentScheduleSection(doc, schedule, x, cursorY, width, {
						title: 'Détail des mensualités (après l\'acompte)',
						preview: true,
						footnote:
							`Total des mensualités : ${this.formatCurrency(scheduleSum)} · ` +
							`Une facture échéancier dédiée vous sera transmise après règlement de l'acompte.`,
					});
				}
			} else if (isInstallment) {
				cursorY = this.drawInstallmentOverviewCard(doc, x, cursorY, width, {
					contractTotal: totalContract,
					depositAmount,
					remainder,
					invoiceTotal,
					scheduleCount: schedule?.length,
				});

				if (hasSchedule && schedule) {
					cursorY += 4;
					cursorY = this.drawInstallmentScheduleSection(doc, schedule, x, cursorY, width, {
						title: 'Échéancier de paiement',
					});
					cursorY = this.drawInstallmentDueNowBox(doc, schedule, invoiceBalance, x, cursorY, width);
				}
			} else {
				const rows: { label: string; amount: number; bold?: boolean; muted?: boolean }[] = [
					{ label: 'Total du devis', amount: totalContract },
					{
						label: 'Paiement acompte (10 %) — réglé',
						amount: depositAmount,
						bold: false,
						muted: true,
					},
					{
						label: 'Solde — sur cette facture',
						amount: remainder,
						bold: true,
						muted: false,
					},
				];

				for (const row of rows) {
					doc
						.font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
						.fontSize(8.5)
						.fillColor(row.muted ? PDF_THEME.textMuted : PDF_THEME.text);
					doc.text(row.label, x, cursorY, { width: labelW });
					doc.text(this.formatCurrency(row.amount), x + labelW, cursorY, {
						width: amountW,
						align: 'right',
					});
					cursorY += 15;
				}

				if (isRemainder && invoiceTotal > 0) {
					cursorY = this.drawThisInvoiceAmountBox(doc, invoiceTotal, x, cursorY, width);
				}
			}
		} else if (hasSchedule && schedule) {
			cursorY = this.drawInstallmentScheduleSection(doc, schedule, x, cursorY, width);
			cursorY = this.drawInstallmentDueNowBox(doc, schedule, invoiceBalance, x, cursorY, width);

			const lines: string[] = [];
			if (options.document?.paymentNote) {
				lines.push(String(options.document.paymentNote));
			} else if (options.kind === 'facture') {
				lines.push('Mode de règlement : virement bancaire ou carte bancaire en ligne.');
			}
			if (iban) lines.push(`IBAN : ${iban}`);

			doc.fontSize(8.5).fillColor(PDF_THEME.text).font('Helvetica');
			for (const line of lines) {
				doc.text(`• ${line}`, x, cursorY, { width, lineGap: 4 });
				cursorY = doc.y + 4;
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
		const compact = legal.compact === true;
		const titleSize = compact ? 6 : 6.5;
		const bodySize = compact ? 6 : 6.5;
		doc.font('Helvetica-Bold').fontSize(titleSize);
		let textHeight = pad;
		if (!compact) {
			textHeight +=
				doc.heightOfString('Mentions légales et conditions contractuelles', { width: textWidth }) + 4;
		}
		doc.font('Helvetica').fontSize(bodySize);
		textHeight += doc.heightOfString(legal.issuerLine, { width: textWidth, lineGap }) + 4;
		for (const p of legal.paragraphs) {
			textHeight += doc.heightOfString(p, { width: textWidth, lineGap }) + 3;
		}
		textHeight += compact ? 10 : 16;
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

		const compact = legal.compact === true;
		const pad = compact ? PDF_LAYOUT.padSm : PDF_LAYOUT.padMd;
		const fontSize = compact ? 6 : 6.5;
		const lineGap = 2;
		const textWidth = contentWidth - pad * 2;

		doc.save();
		doc.rect(marginX, bandTop, contentWidth, bandHeight).fill(PDF_THEME.legalBg);
		doc.restore();

		let y = bandTop + pad;
		if (!compact) {
			doc.fontSize(fontSize).fillColor(PDF_THEME.navy).font('Helvetica-Bold');
			doc.text('Mentions légales et conditions contractuelles', marginX + pad, y, {
				width: textWidth,
			});
			y = doc.y + 4;
		}

		doc.font('Helvetica').fontSize(fontSize).fillColor(PDF_THEME.textMuted);
		doc.text(legal.issuerLine, marginX + pad, y, { width: textWidth, lineGap, align: 'center' });
		y = doc.y + (compact ? 3 : 4);

		doc.font('Helvetica').fontSize(fontSize).fillColor(PDF_THEME.text);
		for (const paragraph of legal.paragraphs) {
			doc.text(paragraph, marginX + pad, y, {
				width: textWidth,
				lineGap,
				align: 'center',
			});
			y = doc.y + 2;
		}

		const pageLineY = Math.min(y + 6, bandTop + bandHeight - pad - 5);
		doc.fontSize(5.5).fillColor(PDF_THEME.textMuted);
		doc.text(`Page ${this.pageIndex} — PrestaFacture`, marginX + pad, pageLineY, {
			width: textWidth,
			align: 'center',
			lineBreak: false,
		});

		doc.x = marginX;
		doc.y = bandTop + bandHeight;
	}

	/** Mentions légales en flux (devis) — évite une page 2 quasi vide. */
	private drawLegalFooterInline(doc: PdfDoc, options: BuildPdfDocumentOptions): void {
		const { marginX, contentWidth } = PDF_LAYOUT;
		const legal = buildFrenchLegalFooter({
			kind: options.kind,
			company: options.company,
			organization: options.organization,
			document: options.document,
			expiryDate: options.expiryDate,
		});

		const compact = legal.compact === true;
		const pad = compact ? PDF_LAYOUT.padSm : PDF_LAYOUT.padMd;
		const fontSize = compact ? 6 : 6.5;
		const lineGap = 2;
		const textWidth = contentWidth - pad * 2;
		const startY = doc.y;

		doc.save();
		doc.rect(marginX, startY, contentWidth, 1).fill(PDF_THEME.legalBg);
		doc.restore();

		let y = startY + pad;
		doc.save();
		doc.rect(marginX, startY, contentWidth, this.measureLegalFooterHeight(doc, options))
			.fill(PDF_THEME.legalBg);
		doc.restore();

		if (!compact) {
			doc.fontSize(fontSize).fillColor(PDF_THEME.navy).font('Helvetica-Bold');
			doc.text('Mentions légales et conditions contractuelles', marginX + pad, y, {
				width: textWidth,
			});
			y = doc.y + 4;
		}

		doc.font('Helvetica').fontSize(fontSize).fillColor(PDF_THEME.textMuted);
		doc.text(legal.issuerLine, marginX + pad, y, { width: textWidth, lineGap, align: 'center' });
		y = doc.y + (compact ? 3 : 4);

		doc.font('Helvetica').fontSize(fontSize).fillColor(PDF_THEME.text);
		for (const paragraph of legal.paragraphs) {
			doc.text(paragraph, marginX + pad, y, {
				width: textWidth,
				lineGap,
				align: 'center',
			});
			y = doc.y + 2;
		}

		doc.fontSize(5.5).fillColor(PDF_THEME.textMuted);
		doc.text(`Page ${this.pageIndex} — PrestaFacture`, marginX + pad, y + 4, {
			width: textWidth,
			align: 'center',
			lineBreak: false,
		});

		doc.x = marginX;
		doc.y = y + 14;
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
		doc.strokeColor(PDF_THEME.highlight).stroke();

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
	const tradeName = organization?.name?.trim() || '';
	const personLegal = organization?.legalName?.trim() || '';
	const displayName =
		tradeName ||
		personLegal ||
		process.env.COMPANY_NAME ||
		'Votre Entreprise';
	const legalNameSubtitle =
		tradeName && personLegal && tradeName !== personLegal ? personLegal : undefined;

	const postal = formatPostalAddress(organization);
	const envAddress = process.env.COMPANY_ADDRESS ?? '';

	return {
		name: displayName,
		legalName: legalNameSubtitle,
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
