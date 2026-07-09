/**
 * Configuration partagée pour les scripts de seed de l'espace démo.
 * Alignée sur server/src/demo/demo.constants.ts (mêmes variables d'environnement).
 */

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}

/** Paramètres complets pour seedPlaywrightDemo (compte démo public). */
export function getDemoSeedConfig() {
	const orgName = process.env.DEMO_ORG_NAME?.trim() || 'Facturio Démo';
	const email = process.env.DEMO_USER_EMAIL?.trim().toLowerCase() || 'demo@facturio.local';

	return {
		orgName,
		email,
		password: process.env.DEMO_USER_PASSWORD?.trim() || 'demo',
		firstName: process.env.DEMO_USER_FIRST_NAME?.trim() || 'Visiteur',
		lastName: process.env.DEMO_USER_LAST_NAME?.trim() || 'Démo',
		monthsBack: clamp(Number(process.env.DEMO_MONTHS_BACK ?? 6), 2, 18),
		clients: clamp(Number(process.env.DEMO_CLIENTS ?? 18), 8, 60),
		invoices: clamp(Number(process.env.DEMO_INVOICES ?? 40), 12, 200),
		quotes: clamp(Number(process.env.DEMO_QUOTES ?? 26), 8, 120),
	};
}
