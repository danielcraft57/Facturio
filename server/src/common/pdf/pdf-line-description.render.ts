import type {
	QuoteLineDeliverable,
	QuoteLineDisplay,
	QuoteLineTechItem,
	QuoteLineTechLayer,
} from '../../products/product-quote-description.util';
import { formatPdfCurrency } from './pdf-currency.util';
import { PDF_THEME } from './pdf-theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfDoc = any;

const TITLE_SIZE = 10;
const BODY_SIZE = 8.5;
const MUTED_SIZE = 7.5;
const PRICE_COL_W = 52;
const HOURS_COL_W = 30;
const COL_GAP = 8;
const ROW_GAP = 3;
const HEADER_H = 11;
const TABLE_PAD = 3;

function deliverablesUsePriceColumns(
	deliverables: QuoteLineDeliverable[],
	priceBreakdownTotal?: number,
): boolean {
	return (
		priceBreakdownTotal != null ||
		deliverables.some((d) => d.amount != null && !Number.isNaN(d.amount))
	);
}

function deliverablesShowHours(deliverables: QuoteLineDeliverable[]): boolean {
	return deliverables.some((d) => d.hours != null && d.hours > 0 && !Number.isNaN(d.hours));
}

function amountColumnsWidth(showHours: boolean): number {
	return PRICE_COL_W + COL_GAP + (showHours ? HOURS_COL_W + COL_GAP : 0);
}

function labelColumnX(x: number, showHours: boolean): number {
	return x + amountColumnsWidth(showHours);
}

function labelColumnWidth(totalWidth: number, showHours: boolean): number {
	return Math.max(totalWidth - amountColumnsWidth(showHours), 80);
}

function measureDeliverableRow(
	doc: PdfDoc,
	d: QuoteLineDeliverable,
	labelW: number,
): number {
	doc.font('Helvetica').fontSize(BODY_SIZE);
	return doc.heightOfString(d.label, { width: labelW, lineGap: 0.5 }) + ROW_GAP;
}

function measureDeliverablesTableBody(
	doc: PdfDoc,
	deliverables: QuoteLineDeliverable[],
	width: number,
	showHours: boolean,
	priceBreakdownTotal?: number,
): number {
	const labelW = labelColumnWidth(width, showHours);
	let h = TABLE_PAD * 2;
	for (const d of deliverables) {
		h += measureDeliverableRow(doc, d, labelW);
	}
	if (priceBreakdownTotal != null) {
		h += 5 + BODY_SIZE + ROW_GAP;
	}
	return h;
}

function drawDeliverableRowColumns(
	doc: PdfDoc,
	d: QuoteLineDeliverable,
	x: number,
	cy: number,
	width: number,
	showHours: boolean,
): number {
	const labelX = labelColumnX(x, showHours);
	const labelW = labelColumnWidth(width, showHours);
	const rowStartY = cy;

	if (d.amount != null && !Number.isNaN(d.amount)) {
		doc.font('Helvetica-Bold')
			.fontSize(BODY_SIZE)
			.fillColor(PDF_THEME.navy)
			.text(formatPdfCurrency(d.amount), x, cy, {
				width: PRICE_COL_W,
				align: 'right',
				lineBreak: false,
			});
	} else {
		doc.font('Helvetica').fontSize(BODY_SIZE).fillColor(PDF_THEME.textMuted);
		doc.text('—', x, cy, { width: PRICE_COL_W, align: 'right', lineBreak: false });
	}

	if (showHours) {
		const hoursX = x + PRICE_COL_W + COL_GAP;
		if (d.hours != null && d.hours > 0 && !Number.isNaN(d.hours)) {
			doc.font('Helvetica').fontSize(MUTED_SIZE).fillColor(PDF_THEME.textMuted);
			doc.text(`${d.hours} h`, hoursX, cy, {
				width: HOURS_COL_W,
				align: 'right',
				lineBreak: false,
			});
		} else {
			doc.font('Helvetica').fontSize(MUTED_SIZE).fillColor(PDF_THEME.textMuted);
			doc.text('—', hoursX, cy, { width: HOURS_COL_W, align: 'right', lineBreak: false });
		}
	}

	doc.font('Helvetica').fontSize(BODY_SIZE).fillColor(PDF_THEME.textDark);
	doc.text(d.label, labelX, rowStartY, { width: labelW, lineGap: 0.5 });

	return Math.max(doc.y - rowStartY, BODY_SIZE + 2) + ROW_GAP;
}

function drawDeliverablesTotalRow(
	doc: PdfDoc,
	x: number,
	cy: number,
	width: number,
	total: number,
	showHours: boolean,
	deliverables: QuoteLineDeliverable[],
): number {
	const labelX = labelColumnX(x, showHours);
	const labelW = labelColumnWidth(width, showHours);
	const hoursTotal = deliverables.reduce(
		(s, d) => s + (d.hours != null && !Number.isNaN(d.hours) ? d.hours : 0),
		0,
	);

	doc.save();
	doc.strokeColor(PDF_THEME.border)
		.lineWidth(0.5)
		.moveTo(x, cy)
		.lineTo(x + width, cy)
		.stroke();
	doc.restore();
	cy += 5;

	doc.font('Helvetica-Bold').fontSize(BODY_SIZE).fillColor(PDF_THEME.navy);
	doc.text(formatPdfCurrency(total), x, cy, {
		width: PRICE_COL_W,
		align: 'right',
		lineBreak: false,
	});

	if (showHours && hoursTotal > 0) {
		doc.font('Helvetica-Bold')
			.fontSize(MUTED_SIZE)
			.fillColor(PDF_THEME.textMuted)
			.text(`${hoursTotal} h`, x + PRICE_COL_W + COL_GAP, cy, {
				width: HOURS_COL_W,
				align: 'right',
				lineBreak: false,
			});
	}

	doc.text('Total', labelX, cy, { width: labelW, lineBreak: false });

	return cy + BODY_SIZE + ROW_GAP;
}

function drawColumnHeaders(
	doc: PdfDoc,
	x: number,
	cy: number,
	width: number,
	showHours: boolean,
): number {
	doc.font('Helvetica-Bold').fontSize(7).fillColor(PDF_THEME.textMuted);
	doc.text('Montant', x, cy, { width: PRICE_COL_W, align: 'right', lineBreak: false });
	if (showHours) {
		doc.text('Heures', x + PRICE_COL_W + COL_GAP, cy, {
			width: HOURS_COL_W,
			align: 'right',
			lineBreak: false,
		});
	}
	doc.text('Livrable', labelColumnX(x, showHours), cy, {
		width: labelColumnWidth(width, showHours),
	});
	return cy + HEADER_H;
}

function drawDeliverablesTable(
	doc: PdfDoc,
	deliverables: QuoteLineDeliverable[],
	x: number,
	cy: number,
	width: number,
	showHours: boolean,
	priceBreakdownTotal?: number,
): number {
	const bodyH = measureDeliverablesTableBody(
		doc,
		deliverables,
		width,
		showHours,
		priceBreakdownTotal,
	);
	const amountW = amountColumnsWidth(showHours);
	const tableTop = cy;

	doc.save();
	doc.roundedRect(x, tableTop, width, bodyH, 4).fill(PDF_THEME.rowAlt);
	doc.roundedRect(x, tableTop, amountW, bodyH, 4).fill('#eef2ff');
	doc.restore();

	const dividerX = labelColumnX(x, showHours) - 5;
	doc.save();
	doc.strokeColor(PDF_THEME.border)
		.lineWidth(0.5)
		.moveTo(dividerX, tableTop)
		.lineTo(dividerX, tableTop + bodyH)
		.stroke();
	doc.restore();

	let rowY = tableTop + TABLE_PAD;
	const innerX = x + 2;
	const innerW = width - 4;
	for (const d of deliverables) {
		rowY += drawDeliverableRowColumns(doc, d, innerX, rowY, innerW, showHours);
	}
	if (priceBreakdownTotal != null) {
		rowY = drawDeliverablesTotalRow(
			doc,
			innerX,
			rowY,
			innerW,
			priceBreakdownTotal,
			showHours,
			deliverables,
		);
	}

	return bodyH;
}

function measureDeliverablesSection(
	doc: PdfDoc,
	deliverables: QuoteLineDeliverable[],
	width: number,
	priceBreakdownTotal?: number,
): number {
	const useColumns = deliverablesUsePriceColumns(deliverables, priceBreakdownTotal);
	const showHours = deliverablesShowHours(deliverables);
	const sectionTitle =
		priceBreakdownTotal != null ? 'Répartition du montant' : 'Ce qui est inclus';

	let h = 0;
	doc.font('Helvetica-Bold').fontSize(BODY_SIZE);
	h += doc.heightOfString(sectionTitle, { width }) + 2;

	if (useColumns) {
		h += HEADER_H;
		h += measureDeliverablesTableBody(
			doc,
			deliverables,
			width,
			showHours,
			priceBreakdownTotal,
		);
	} else {
		doc.font('Helvetica').fontSize(BODY_SIZE);
		for (const d of deliverables) {
			h += doc.heightOfString(`• ${d.label}`, { width: width - 2, lineGap: 0.5 }) + 1;
		}
	}
	return h + 3;
}

function drawDeliverablesSection(
	doc: PdfDoc,
	deliverables: QuoteLineDeliverable[],
	x: number,
	cy: number,
	width: number,
	priceBreakdownTotal?: number,
): number {
	const startY = cy;
	const useColumns = deliverablesUsePriceColumns(deliverables, priceBreakdownTotal);
	const showHours = deliverablesShowHours(deliverables);
	const sectionTitle =
		priceBreakdownTotal != null ? 'Répartition du montant' : 'Ce qui est inclus';

	doc.font('Helvetica-Bold')
		.fontSize(BODY_SIZE)
		.fillColor(PDF_THEME.highlight)
		.text(sectionTitle, x, cy, { width });
	cy = doc.y + 2;

	if (useColumns) {
		cy = drawColumnHeaders(doc, x, cy, width, showHours);
		const tableH = drawDeliverablesTable(
			doc,
			deliverables,
			x,
			cy,
			width,
			showHours,
			priceBreakdownTotal,
		);
		cy += tableH + 2;
	} else {
		doc.font('Helvetica').fontSize(BODY_SIZE).fillColor(PDF_THEME.textDark);
		for (const d of deliverables) {
			doc.text(`• ${d.label}`, x + 2, cy, { width: width - 2, lineGap: 0.5 });
			cy = doc.y + 1;
		}
		cy += 2;
	}

	return cy - startY;
}

function formatTechItemLine(layer: QuoteLineTechLayer, item: QuoteLineTechItem): string {
	const prefix = layer.items.length === 1 ? `${layer.category} : ` : '';
	const explain = item.explain?.trim();
	if (explain) return `• ${prefix}${item.label} : ${explain}`;
	return `• ${prefix}${item.label}`;
}

function measureTechLayer(doc: PdfDoc, layer: QuoteLineTechLayer, width: number): number {
	let h = 0;
	if (layer.items.length > 1) {
		doc.font('Helvetica-Bold').fontSize(MUTED_SIZE);
		h += doc.heightOfString(layer.category, { width }) + 1;
	}
	doc.font('Helvetica').fontSize(MUTED_SIZE);
	for (const item of layer.items) {
		h +=
			doc.heightOfString(formatTechItemLine(layer, item), {
				width: width - 2,
				lineGap: 0.5,
			}) + 1;
	}
	return h + 2;
}

function drawTechLayer(
	doc: PdfDoc,
	layer: QuoteLineTechLayer,
	x: number,
	cy: number,
	width: number,
): number {
	if (layer.items.length > 1) {
		doc.font('Helvetica-Bold')
			.fontSize(MUTED_SIZE)
			.fillColor(PDF_THEME.textDark)
			.text(layer.category, x, cy, { width });
		cy = doc.y + 1;
	}
	doc.font('Helvetica').fontSize(MUTED_SIZE).fillColor(PDF_THEME.textDark);
	for (const item of layer.items) {
		doc.text(formatTechItemLine(layer, item), x + 2, cy, {
			width: width - 2,
			lineGap: 0.5,
		});
		cy = doc.y + 1;
	}
	return cy + 1;
}

export function measureQuoteLineDisplayHeight(
	doc: PdfDoc,
	display: QuoteLineDisplay,
	width: number,
	paddingY = 8,
): number {
	let h = paddingY;
	doc.font('Helvetica-Bold').fontSize(TITLE_SIZE);
	h += doc.heightOfString(display.title, { width }) + 3;

	if (display.summary) {
		doc.font('Helvetica').fontSize(BODY_SIZE);
		h += doc.heightOfString(display.summary, { width, lineGap: 1 }) + 4;
	}

	if (display.deliverables?.length) {
		h += measureDeliverablesSection(
			doc,
			display.deliverables,
			width,
			display.priceBreakdownTotal,
		);
	}

	if (display.techLayers?.length) {
		doc.font('Helvetica-Bold').fontSize(BODY_SIZE);
		h += doc.heightOfString('Technologies utilisées', { width }) + 2;
		for (const layer of display.techLayers) {
			h += measureTechLayer(doc, layer, width);
		}
	}

	return h + paddingY;
}

export function drawQuoteLineDisplay(
	doc: PdfDoc,
	display: QuoteLineDisplay,
	x: number,
	y: number,
	width: number,
): number {
	let cy = y;

	doc.font('Helvetica-Bold')
		.fontSize(TITLE_SIZE)
		.fillColor(PDF_THEME.textDark)
		.text(display.title, x, cy, { width, lineGap: 1 });
	cy = doc.y + 3;

	if (display.summary) {
		doc.font('Helvetica')
			.fontSize(BODY_SIZE)
			.fillColor(PDF_THEME.textDark)
			.text(display.summary, x, cy, { width, lineGap: 1 });
		cy = doc.y + 4;
	}

	if (display.deliverables?.length) {
		cy += drawDeliverablesSection(
			doc,
			display.deliverables,
			x,
			cy,
			width,
			display.priceBreakdownTotal,
		);
	}

	if (display.techLayers?.length) {
		doc.font('Helvetica-Bold')
			.fontSize(BODY_SIZE)
			.fillColor(PDF_THEME.highlight)
			.text('Technologies utilisées', x, cy, { width });
		cy = doc.y + 2;

		for (const layer of display.techLayers) {
			cy = drawTechLayer(doc, layer, x, cy, width);
		}
	}

	return cy - y;
}

const INLINE_HOURS_W = 40;

export function quoteLineUsesAlignedDeliverableRows(display: QuoteLineDisplay): boolean {
	const deliverables = display.deliverables ?? [];
	return deliverablesUsePriceColumns(deliverables, display.priceBreakdownTotal);
}

export type DevisTableRowPlan = {
	height: number;
	unitPrice: number | null;
	lineTotal: number | null;
	drawDescription: (doc: PdfDoc, x: number, y: number, width: number) => void;
};

function measureIntroBlock(doc: PdfDoc, display: QuoteLineDisplay, width: number): number {
	let h = 0;
	doc.font('Helvetica-Bold').fontSize(TITLE_SIZE);
	h += doc.heightOfString(display.title, { width }) + 3;
	if (display.summary) {
		doc.font('Helvetica').fontSize(BODY_SIZE);
		h += doc.heightOfString(display.summary, { width, lineGap: 1 }) + 4;
	}
	return h;
}

function drawIntroBlock(
	doc: PdfDoc,
	display: QuoteLineDisplay,
	x: number,
	y: number,
	width: number,
): void {
	doc.font('Helvetica-Bold')
		.fontSize(TITLE_SIZE)
		.fillColor(PDF_THEME.textDark)
		.text(display.title, x, y, { width, lineGap: 1 });
	let cy = doc.y + 3;
	if (display.summary) {
		doc.font('Helvetica')
			.fontSize(BODY_SIZE)
			.fillColor(PDF_THEME.textDark)
			.text(display.summary, x, cy, { width, lineGap: 1 });
	}
}

function measureDeliverableInlineRow(
	doc: PdfDoc,
	d: QuoteLineDeliverable,
	width: number,
): number {
	const hasHours = d.hours != null && d.hours > 0 && !Number.isNaN(d.hours);
	const labelW = hasHours ? Math.max(width - INLINE_HOURS_W - 6, 60) : width - 4;
	doc.font('Helvetica').fontSize(BODY_SIZE);
	return doc.heightOfString(d.label, { width: labelW, lineGap: 0.5 }) + ROW_GAP;
}

function drawDeliverableInlineRow(
	doc: PdfDoc,
	d: QuoteLineDeliverable,
	x: number,
	y: number,
	width: number,
): void {
	const hasHours = d.hours != null && d.hours > 0 && !Number.isNaN(d.hours);
	const labelW = hasHours ? Math.max(width - INLINE_HOURS_W - 6, 60) : width - 4;
	doc.font('Helvetica').fontSize(BODY_SIZE).fillColor(PDF_THEME.textDark);
	doc.text(d.label, x + 4, y, { width: labelW, lineGap: 0.5 });
	if (hasHours) {
		doc.font('Helvetica').fontSize(MUTED_SIZE).fillColor(PDF_THEME.textMuted);
		doc.text(`${d.hours} h`, x + width - INLINE_HOURS_W, y, {
			width: INLINE_HOURS_W,
			align: 'right',
			lineBreak: false,
		});
	}
}

function measureTechBlock(doc: PdfDoc, display: QuoteLineDisplay, width: number): number {
	let h = 0;
	if (!display.techLayers?.length) return 0;
	doc.font('Helvetica-Bold').fontSize(BODY_SIZE);
	h += doc.heightOfString('Technologies utilisées', { width }) + 2;
	for (const layer of display.techLayers) {
		h += measureTechLayer(doc, layer, width);
	}
	return h + 2;
}

function drawTechBlock(
	doc: PdfDoc,
	display: QuoteLineDisplay,
	x: number,
	y: number,
	width: number,
): void {
	if (!display.techLayers?.length) return;
	let cy = y;
	doc.font('Helvetica-Bold')
		.fontSize(BODY_SIZE)
		.fillColor(PDF_THEME.highlight)
		.text('Technologies utilisées', x, cy, { width });
	cy = doc.y + 2;
	for (const layer of display.techLayers) {
		cy = drawTechLayer(doc, layer, x, cy, width);
	}
}

export function buildDevisTableRowPlans(
	doc: PdfDoc,
	display: QuoteLineDisplay,
	descWidth: number,
	padY: number,
	minRowH: number,
): DevisTableRowPlan[] {
	const rows: DevisTableRowPlan[] = [];
	const introH = measureIntroBlock(doc, display, descWidth);
	rows.push({
		height: Math.max(minRowH, introH + padY * 2),
		unitPrice: null,
		lineTotal: null,
		drawDescription: (d, x, y, w) => drawIntroBlock(d, display, x, y, w),
	});

	for (const d of display.deliverables ?? []) {
		const h = measureDeliverableInlineRow(doc, d, descWidth);
		const amount = d.amount != null && !Number.isNaN(d.amount) ? d.amount : null;
		rows.push({
			height: Math.max(minRowH, h + padY * 2),
			unitPrice: amount,
			lineTotal: amount,
			drawDescription: (doc2, x, y, w) => drawDeliverableInlineRow(doc2, d, x, y, w),
		});
	}

	if (display.techLayers?.length) {
		const techH = measureTechBlock(doc, display, descWidth);
		rows.push({
			height: Math.max(minRowH, techH + padY * 2),
			unitPrice: null,
			lineTotal: null,
			drawDescription: (doc2, x, y, w) => drawTechBlock(doc2, display, x, y, w),
		});
	}

	return rows;
}
