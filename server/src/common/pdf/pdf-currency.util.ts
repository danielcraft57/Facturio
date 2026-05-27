/**
 * Format monétaire pour PDF (Helvetica / PDFKit).
 * Évite U+202F (espace fine insécable de Intl fr-FR) affiché parfois comme « / ».
 */
export function formatPdfCurrency(amount: unknown): string {
	const n = Number(amount);
	if (!Number.isFinite(n)) return '0,00\u00A0€';
	const sign = n < 0 ? '-' : '';
	const abs = Math.abs(n);
	const cents = Math.round(abs * 100);
	const euros = Math.floor(cents / 100);
	const fractional = String(cents % 100).padStart(2, '0');
	const eurosStr = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
	return `${sign}${eurosStr},${fractional}\u00A0€`;
}
