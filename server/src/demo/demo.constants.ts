/**
 * Configuration du compte et de l'organisation démo.
 * Surchargeable via variables d'environnement (dev, staging, prod).
 */

/** Désactiver l'entrée démo publique avec DEMO_ENABLED=0 */
export function isDemoFeatureEnabled(): boolean {
	const raw = process.env.DEMO_ENABLED?.trim().toLowerCase();
	return raw !== '0' && raw !== 'false';
}

export const DEMO_ORG_NAME = process.env.DEMO_ORG_NAME?.trim() || 'Facturio Démo';

export const DEMO_USER_EMAIL =
	process.env.DEMO_USER_EMAIL?.trim().toLowerCase() || 'demo@facturio.local';

export const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD?.trim() || 'demo';

/** Prénom / nom affichés pour le compte démo. */
export const DEMO_USER_FIRST_NAME = process.env.DEMO_USER_FIRST_NAME?.trim() || 'Visiteur';
export const DEMO_USER_LAST_NAME = process.env.DEMO_USER_LAST_NAME?.trim() || 'Démo';

function clamp(n: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, n));
}

/** Volumes du jeu de données démo (seed). */
export function getDemoSeedVolumes() {
	return {
		monthsBack: clamp(Number(process.env.DEMO_MONTHS_BACK ?? 6), 2, 18),
		clients: clamp(Number(process.env.DEMO_CLIENTS ?? 18), 8, 60),
		invoices: clamp(Number(process.env.DEMO_INVOICES ?? 40), 12, 200),
		quotes: clamp(Number(process.env.DEMO_QUOTES ?? 26), 8, 120),
	};
}

/** Ajouter l'org démo à la fin de `npm run seed:dev` (DEMO_SEED_ON_DEV=0 pour désactiver). */
export function isDemoSeedOnDevEnabled(): boolean {
	const raw = process.env.DEMO_SEED_ON_DEV?.trim().toLowerCase();
	if (raw === '0' || raw === 'false') return false;
	return true;
}
