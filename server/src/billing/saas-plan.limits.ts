import type { SaasBillingPlan } from '@prisma/client';

export type SaasPlanFeature =
	| 'eInvoicing'
	| 'multiUser'
	| 'publicApi'
	| 'accounting'
	| 'financeModule';

export type SaasPlanLimits = {
	plan: SaasBillingPlan;
	label: string;
	maxInvoicesPerMonth: number | null;
	/** Quota mensuel de devis créés (null = illimité). */
	maxQuotesPerMonth: number | null;
	/** Quota mensuel d'emails document (facture, devis, relance, dette). */
	maxEmailsPerMonth: number | null;
	eInvoicing: boolean;
	stripePayments: boolean;
	multiUser: boolean;
	/** API REST publique + jetons Bearer */
	publicApi: boolean;
	/** FEC, balance, grand livre, sync compta. */
	accounting: boolean;
	/** Créances clients et dettes fournisseurs. */
	financeModule: boolean;
	/** Filigrane « Facturio » sur les PDF facture/devis. */
	pdfWatermark: boolean;
};

/**
 * Lit un entier positif depuis l'environnement (fallback si absent ou invalide).
 *
 * @param name - Nom de la variable d'environnement
 * @param fallback - Valeur par défaut
 */
function parsePositiveIntEnv(name: string, fallback: number): number {
	const raw = process.env[name]?.trim();
	if (!raw) return fallback;
	const n = Number.parseInt(raw, 10);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const SAAS_PLAN_LIMITS: Record<SaasBillingPlan, SaasPlanLimits> = {
	FREE: {
		plan: 'FREE',
		label: 'Free',
		maxInvoicesPerMonth: 25,
		maxQuotesPerMonth: 10,
		maxEmailsPerMonth: 20,
		eInvoicing: false,
		stripePayments: true,
		multiUser: false,
		publicApi: false,
		accounting: false,
		financeModule: false,
		pdfWatermark: true,
	},
	PRO: {
		plan: 'PRO',
		label: 'Pro',
		maxInvoicesPerMonth: null,
		maxQuotesPerMonth: null,
		maxEmailsPerMonth: null,
		eInvoicing: false,
		stripePayments: true,
		multiUser: false,
		publicApi: true,
		accounting: true,
		financeModule: true,
		pdfWatermark: false,
	},
	PRO_EFACTURE: {
		plan: 'PRO_EFACTURE',
		label: 'Pro + e-facture',
		maxInvoicesPerMonth: null,
		maxQuotesPerMonth: null,
		maxEmailsPerMonth: null,
		eInvoicing: true,
		stripePayments: true,
		multiUser: false,
		publicApi: true,
		accounting: true,
		financeModule: true,
		pdfWatermark: false,
	},
	AGENCY: {
		plan: 'AGENCY',
		label: 'Agence',
		maxInvoicesPerMonth: null,
		maxQuotesPerMonth: null,
		maxEmailsPerMonth: null,
		eInvoicing: true,
		stripePayments: true,
		multiUser: true,
		publicApi: true,
		accounting: true,
		financeModule: true,
		pdfWatermark: false,
	},
};

/**
 * Limites effectives d'un plan SaaS (variables d'environnement pour le plan Free).
 *
 * @param plan - Plan SaaS
 * @returns Limites applicables (quotas Free surchargeables via SAAS_FREE_MAX_*)
 *
 * @example
 * // server/.env : SAAS_FREE_MAX_INVOICES_PER_MONTH=5
 * getSaasPlanLimits('FREE').maxInvoicesPerMonth // 5
 */
export function getSaasPlanLimits(plan: SaasBillingPlan): SaasPlanLimits {
	const base = SAAS_PLAN_LIMITS[plan];
	if (plan !== 'FREE') return base;
	return {
		...base,
		maxInvoicesPerMonth: parsePositiveIntEnv(
			'SAAS_FREE_MAX_INVOICES_PER_MONTH',
			base.maxInvoicesPerMonth!,
		),
		maxQuotesPerMonth: parsePositiveIntEnv(
			'SAAS_FREE_MAX_QUOTES_PER_MONTH',
			base.maxQuotesPerMonth!,
		),
		maxEmailsPerMonth: parsePositiveIntEnv(
			'SAAS_FREE_MAX_EMAILS_PER_MONTH',
			base.maxEmailsPerMonth!,
		),
	};
}
