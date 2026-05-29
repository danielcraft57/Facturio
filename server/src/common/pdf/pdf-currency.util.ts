/**
 * Format monétaire pour PDF (Helvetica / PDFKit).
 * Évite U+202F (espace fine insécable de Intl fr-FR) affiché parfois comme « / ».
 */
export function formatPdfCurrency(amount: unknown): string {
	const n = Number(amount);
	if (!Number.isFinite(n)) return '0\u00A0€';
	const sign = n < 0 ? '-' : '';
	const abs = Math.abs(n);
	const euros = Math.round(abs);
	const eurosStr = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
	return `${sign}${eurosStr}\u00A0€`;
}
