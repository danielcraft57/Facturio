/** Palette Facturio — alignée sur l’app (#0f172a / #1e3a5f / #1e40af) */
export const PDF_THEME = {
	navy: '#0f172a',
	navyMid: '#1e3a5f',
	accent: '#1e40af',
	accentLight: '#3b82f6',
	white: '#FFFFFF',
	text: '#374151',
	textDark: '#0f172a',
	textMuted: '#64748b',
	border: '#e2e8f0',
	rowAlt: '#f8fafc',
	legalBg: '#f1f5f9',
	/** Bordures & totaux (remplace l’ancien rouge corporate) */
	highlight: '#1e40af',
} as const;

export const PDF_LAYOUT = {
	pageWidth: 595.28,
	marginX: 50,
	contentWidth: 495.28,
	padSm: 8,
	padMd: 14,
	padLg: 20,
	sectionGap: 14,
	headerHeight: 118,
	headerContentBottom: 132,
	tableHeaderHeight: 32,
	lineHeight: 32,
	tableCellPadX: 14,
	tableCellPadY: 10,
} as const;

export type PdfDocumentKind = 'facture' | 'devis';

export interface PdfCompanyInfo {
	/** Nom affiché (raison sociale ou nom commercial). */
	name: string;
	/** Nom légal si différent du nom commercial (EI). */
	legalName?: string;
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
	creditApplied?: number;
	netDue?: number;
}
