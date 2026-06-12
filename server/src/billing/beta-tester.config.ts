import { SaasBillingPlan } from '@prisma/client';

/** Configuration du programme beta testeurs (variables d'environnement). */
export interface BetaTesterConfig {
	/** Nombre maximum de testeurs inscrits via beta (plafond global). */
	maxSlots: number;
	/** Durée d'accès complet en jours après activation du code. */
	durationDays: number;
	/** Plan SaaS accordé pendant la période beta (accès « full » = Agence). */
	grantedPlan: SaasBillingPlan;
	/** Fin du programme (aucune nouvelle inscription beta après cette date). */
	programEndsAt: Date | null;
	/** Longueur minimale des codes (ex. DEV). */
	codeMinLength: number;
	/** Longueur maximale des codes (< 7 caractères). */
	codeMaxLength: number;
}

const DEFAULT_MAX_SLOTS = 20;
const DEFAULT_DURATION_DAYS = 90;
const DEFAULT_CODE_MIN_LENGTH = 3;
const DEFAULT_CODE_MAX_LENGTH = 6;

/**
 * Lit la configuration beta depuis l'environnement.
 *
 * @returns Configuration avec valeurs par défaut si variables absentes
 */
export function readBetaTesterConfig(): BetaTesterConfig {
	const maxSlots = Number(process.env.BETA_TESTER_MAX_SLOTS ?? DEFAULT_MAX_SLOTS);
	const durationDays = Number(process.env.BETA_TESTER_DURATION_DAYS ?? DEFAULT_DURATION_DAYS);
	const grantedPlan = parseGrantedPlan(process.env.BETA_TESTER_PLAN);

	const codeMinLength = Number(process.env.BETA_TESTER_CODE_MIN_LENGTH ?? DEFAULT_CODE_MIN_LENGTH);
	const codeMaxLength = Number(process.env.BETA_TESTER_CODE_MAX_LENGTH ?? DEFAULT_CODE_MAX_LENGTH);
	const programEndsAt = parseOptionalDate(process.env.BETA_TESTER_PROGRAM_ENDS_AT);

	return {
		maxSlots: Number.isFinite(maxSlots) && maxSlots > 0 ? Math.floor(maxSlots) : DEFAULT_MAX_SLOTS,
		durationDays:
			Number.isFinite(durationDays) && durationDays > 0
				? Math.floor(durationDays)
				: DEFAULT_DURATION_DAYS,
		grantedPlan,
		programEndsAt,
		codeMinLength:
			Number.isFinite(codeMinLength) && codeMinLength > 0
				? Math.floor(codeMinLength)
				: DEFAULT_CODE_MIN_LENGTH,
		codeMaxLength:
			Number.isFinite(codeMaxLength) && codeMaxLength > 0
				? Math.floor(codeMaxLength)
				: DEFAULT_CODE_MAX_LENGTH,
	};
}

/**
 * @param raw - Date ISO ou YYYY-MM-DD
 * @returns Date ou null si absent / invalide
 */
function parseOptionalDate(raw: string | undefined): Date | null {
	if (!raw?.trim()) return null;
	const d = new Date(raw.includes('T') ? raw.trim() : `${raw.trim()}T23:59:59.999Z`);
	return Number.isNaN(d.getTime()) ? null : d;
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
