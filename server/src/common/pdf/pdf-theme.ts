/** Palette et dimensions du template PDF facture / devis */
export const PDF_THEME = {
	navy: '#2C2E4E',
	red: '#B21F2D',
	white: '#FFFFFF',
	text: '#374151',
	textDark: '#1f2937',
	textMuted: '#6b7280',
	border: '#e5e7eb',
	rowAlt: '#f8f9fb',
	legalBg: '#f3f4f6'
} as const;

export const PDF_LAYOUT = {
	pageWidth: 595.28,
	marginX: 50,
	contentWidth: 495.28,
	/** Espacements (pt) */
	padSm: 8,
	padMd: 14,
	padLg: 20,
	sectionGap: 16,
	headerHeight: 128,
	headerContentBottom: 148,
	tableHeaderHeight: 36,
	lineHeight: 32,
	tableCellPadX: 16,
	tableCellPadY: 11
} as const;

export type PdfDocumentKind = 'facture' | 'devis';

export interface PdfCompanyInfo {
	name: string;
	legalForm?: string;
	capital?: string;
	address: string;
	phone: string;
	email: string;
	website: string;
	siret: string;
	rcs: string;
	vat: string;
	apeCode?: string;
	logo?: string | null;
}

export interface PdfTotals {
	subtotal: number;
	tax: number;
	total: number;
}
