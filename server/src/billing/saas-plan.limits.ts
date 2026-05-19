import type { SaasBillingPlan } from '@prisma/client';

export type SaasPlanLimits = {
	plan: SaasBillingPlan;
	label: string;
	maxInvoicesPerMonth: number | null;
	eInvoicing: boolean;
	stripePayments: boolean;
	prospection: boolean;
	multiUser: boolean;
};

export const SAAS_PLAN_LIMITS: Record<SaasBillingPlan, SaasPlanLimits> = {
	FREE: {
		plan: 'FREE',
		label: 'Free',
		maxInvoicesPerMonth: 10,
		eInvoicing: false,
		stripePayments: true,
		prospection: false,
		multiUser: false,
	},
	PRO: {
		plan: 'PRO',
		label: 'Pro',
		maxInvoicesPerMonth: null,
		eInvoicing: false,
		stripePayments: true,
		prospection: true,
		multiUser: false,
	},
	PRO_EFACTURE: {
		plan: 'PRO_EFACTURE',
		label: 'Pro + e-facture',
		maxInvoicesPerMonth: null,
		eInvoicing: true,
		stripePayments: true,
		prospection: true,
		multiUser: false,
	},
	AGENCY: {
		plan: 'AGENCY',
		label: 'Agence',
		maxInvoicesPerMonth: null,
		eInvoicing: true,
		stripePayments: true,
		prospection: true,
		multiUser: true,
	},
};
