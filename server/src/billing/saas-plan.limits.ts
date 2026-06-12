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
