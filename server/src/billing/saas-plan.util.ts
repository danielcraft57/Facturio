import { SaasBillingPlan } from '@prisma/client';

/**
 * Résout le plan SaaS effectif en tenant compte d'une éventuelle expiration (prépayé, beta, etc.).
 *
 * @param org - Organisation avec plan et date de fin
 * @returns Plan actuellement appliqué aux garde-fous
 */
export function resolveEffectiveSaasPlan(org: {
	saasPlan: SaasBillingPlan;
	saasPlanExpiresAt: Date | null;
}): SaasBillingPlan {
	if (
		org.saasPlanExpiresAt &&
		org.saasPlanExpiresAt < new Date() &&
		org.saasPlan !== SaasBillingPlan.FREE
	) {
		return SaasBillingPlan.FREE;
	}
	return org.saasPlan;
}
