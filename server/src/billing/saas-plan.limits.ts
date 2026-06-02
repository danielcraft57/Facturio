import type { SaasBillingPlan } from '@prisma/client';

export type SaasPlanLimits = {
	plan: SaasBillingPlan;
	label: string;
	maxInvoicesPerMonth: number | null;
	eInvoicing: boolean;
	stripePayments: boolean;
	prospection: boolean;
	multiUser: boolean;
	/** API REST publique + jetons Bearer */
	publicApi: boolean;
};

export const SAAS_PLAN_LIMITS: Record<SaasBillingPlan, SaasPlanLimits> = {
	FREE: {
		plan: 'FREE',
		label: 'Free',
		maxInvoicesPerMonth: 25,
		eInvoicing: false,
		stripePayments: true,
		prospection: false,
		multiUser: false,
		publicApi: false,
	},
	PRO: {
		plan: 'PRO',
		label: 'Pro',
		maxInvoicesPerMonth: null,
		eInvoicing: false,
		stripePayments: true,
		prospection: true,
		multiUser: false,
		publicApi: true,
	},
	PRO_EFACTURE: {
		plan: 'PRO_EFACTURE',
		label: 'Pro + e-facture',
		maxInvoicesPerMonth: null,
		eInvoicing: true,
		stripePayments: true,
		prospection: true,
		multiUser: false,
		publicApi: true,
	},
	AGENCY: {
		plan: 'AGENCY',
		label: 'Agence',
		maxInvoicesPerMonth: null,
		eInvoicing: true,
		stripePayments: true,
		prospection: true,
		multiUser: true,
		publicApi: true,
	},
};
