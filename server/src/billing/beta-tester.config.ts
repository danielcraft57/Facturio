import { SaasBillingPlan } from '@prisma/client';

/** Configuration du programme beta testeurs (variables d'environnement). */
export interface BetaTesterConfig {
	/** Nombre maximum de codes utilisés (plafond global). */
	maxSlots: number;
	/** Durée d'accès complet en jours après activation du code. */
	durationDays: number;
	/** Plan SaaS accordé pendant la période beta (accès « full » = Agence). */
	grantedPlan: SaasBillingPlan;
}

const DEFAULT_MAX_SLOTS = 20;
const DEFAULT_DURATION_DAYS = 90;

/**
 * Lit la configuration beta depuis l'environnement.
 *
 * @returns Configuration avec valeurs par défaut si variables absentes
 */
export function readBetaTesterConfig(): BetaTesterConfig {
	const maxSlots = Number(process.env.BETA_TESTER_MAX_SLOTS ?? DEFAULT_MAX_SLOTS);
	const durationDays = Number(process.env.BETA_TESTER_DURATION_DAYS ?? DEFAULT_DURATION_DAYS);
	const grantedPlan = parseGrantedPlan(process.env.BETA_TESTER_PLAN);

	return {
		maxSlots: Number.isFinite(maxSlots) && maxSlots > 0 ? Math.floor(maxSlots) : DEFAULT_MAX_SLOTS,
		durationDays:
			Number.isFinite(durationDays) && durationDays > 0
				? Math.floor(durationDays)
				: DEFAULT_DURATION_DAYS,
		grantedPlan,
	};
}

/**
 * @param raw - Valeur brute de BETA_TESTER_PLAN
 * @returns Plan accordé aux beta testeurs
 */
function parseGrantedPlan(raw: string | undefined): SaasBillingPlan {
	const normalized = (raw ?? 'AGENCY').trim().toUpperCase().replace(/-/g, '_');
	if (normalized === 'AGENCY') return SaasBillingPlan.AGENCY;
	if (normalized === 'PRO_EFACTURE') return SaasBillingPlan.PRO_EFACTURE;
	if (normalized === 'PRO') return SaasBillingPlan.PRO;
	return SaasBillingPlan.AGENCY;
}
