/**
 * URL de base du frontend (pages publiques devis/factures).
 * Ne jamais utiliser API_URL (port 3000) : les routes /facture/:token sont servies par Vite/React.
 */
export function resolvePublicAppBaseUrl(): string {
	// PUBLIC_APP_URL en priorité : URL canonique des liens email / pages publiques
	let base =
		process.env.PUBLIC_APP_URL?.trim() ||
		process.env.FRONTEND_URL?.trim() ||
		'http://localhost:5173';

	base = base.replace(/\/$/, '');

	// Correction courante en dev : PUBLIC_APP_URL pointe par erreur vers le backend Nest
	if (/^https?:\/\/(localhost|127\.0\.0\.1):3000$/i.test(base)) {
		base = base.replace(':3000', ':5173');
	}

	return base;
}

export function buildPublicInvoiceUrl(publicToken: string): string {
	return `${resolvePublicAppBaseUrl()}/facture/${publicToken}`;
}

export function buildPublicQuoteUrl(publicToken: string): string {
	return `${resolvePublicAppBaseUrl()}/public/devis/${publicToken}`;
}

export function buildPublicPayableDebtUrl(publicToken: string): string {
	return `${resolvePublicAppBaseUrl()}/dette/${publicToken}`;
}
