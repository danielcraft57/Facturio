import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SaasBillingPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SAAS_PLAN_LIMITS } from './saas-plan.limits';

@Injectable()
export class BillingService {
	constructor(private readonly prisma: PrismaService) {}

	/** Mois calendaire en cours (fuseau serveur) — le quota Free se réinitialise le 1er à 00:00. */
	monthBounds(now = new Date()): { start: Date; end: Date; resetsAt: Date } {
		const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
		const resetsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
		return { start, end, resetsAt };
	}

	async getOrganizationPlan(organizationId: number): Promise<SaasBillingPlan> {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: { saasPlan: true, saasPlanExpiresAt: true },
		});
		if (!org) throw new NotFoundException('Organisation introuvable');

		if (org.saasPlanExpiresAt && org.saasPlanExpiresAt < new Date() && org.saasPlan !== 'FREE') {
			return SaasBillingPlan.FREE;
		}
		return org.saasPlan;
	}

	async countInvoicesThisMonth(organizationId: number): Promise<number> {
		const { start, end } = this.monthBounds();
		return this.prisma.invoice.count({
			where: {
				organizationId,
				createdAt: { gte: start, lte: end },
			},
		});
	}

	async getUsage(organizationId: number) {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: {
				saasPlan: true,
				saasPlanExpiresAt: true,
				saasSubscriptionStatus: true,
				stripeCustomerId: true,
				stripeSubscriptionId: true,
			},
		});
		if (!org) throw new NotFoundException('Organisation introuvable');

		let plan = org.saasPlan;
		if (
			org.saasPlanExpiresAt &&
			org.saasPlanExpiresAt < new Date() &&
			org.saasPlan !== SaasBillingPlan.FREE
		) {
			plan = SaasBillingPlan.FREE;
		}

		const limits = SAAS_PLAN_LIMITS[plan];
		const period = this.monthBounds();
		const invoicesThisMonth = await this.countInvoicesThisMonth(organizationId);
		const max = limits.maxInvoicesPerMonth;

		const isPaidPlan = plan !== SaasBillingPlan.FREE;
		const cancelAtPeriodEnd = org.saasSubscriptionStatus === 'cancel_at_period_end';
		const hasRecurringSubscription = !!org.stripeSubscriptionId;
		const prepaidUntil =
			isPaidPlan &&
			!hasRecurringSubscription &&
			!!org.saasPlanExpiresAt &&
			org.saasPlanExpiresAt > new Date();

		const subscription =
			isPaidPlan || org.stripeCustomerId
				? {
						status: org.saasSubscriptionStatus,
						cancelAtPeriodEnd,
						currentPeriodEnd: org.saasPlanExpiresAt?.toISOString() ?? null,
						canManagePortal: !!org.stripeCustomerId,
						hasRecurringSubscription,
						hasActiveSubscription:
							hasRecurringSubscription ||
							prepaidUntil ||
							(isPaidPlan &&
								!!org.saasPlanExpiresAt &&
								org.saasPlanExpiresAt > new Date()),
					}
				: null;

		return {
			plan,
			planLabel: limits.label,
			limits,
			usage: {
				invoicesThisMonth,
			},
			/** Période du quota mensuel (factures créées entre periodStart et periodEnd inclus). */
			billingPeriod: {
				start: period.start.toISOString(),
				end: period.end.toISOString(),
				resetsAt: period.resetsAt.toISOString(),
			},
			remainingInvoices: max == null ? null : Math.max(0, max - invoicesThisMonth),
			atLimit: max != null && invoicesThisMonth >= max,
			subscription,
		};
	}

	/** Bloque la création de facture si quota Free dépassé. */
	async assertCanCreateInvoice(organizationId: number): Promise<void> {
		const usage = await this.getUsage(organizationId);
		if (usage.atLimit) {
			throw new ForbiddenException(
				`Quota mensuel atteint (${usage.limits.maxInvoicesPerMonth} factures ce mois-ci sur le plan ${usage.planLabel}). Le compteur est réinitialisé le 1er du mois suivant. Passez au plan Pro pour continuer.`,
			);
		}
	}

	async assertCanUseEInvoicing(organizationId: number): Promise<void> {
		const plan = await this.getOrganizationPlan(organizationId);
		if (!this.hasFeature(plan, 'eInvoicing')) {
			throw new ForbiddenException(
				'La facturation électronique (Factur-X) est réservée au plan Pro + e-facture.',
			);
		}
	}

	async assertCanUseProspection(organizationId: number): Promise<void> {
		const plan = await this.getOrganizationPlan(organizationId);
		if (!this.hasFeature(plan, 'prospection')) {
			throw new ForbiddenException(
				`La prospection ProspectLab est réservée au plan Pro. Passez au plan Pro pour importer et consulter des prospects.`,
			);
		}
	}

	async assertCanUsePublicApi(organizationId: number): Promise<void> {
		const plan = await this.getOrganizationPlan(organizationId);
		if (!this.hasFeature(plan, 'publicApi')) {
			throw new ForbiddenException(
				'L’API publique, les jetons d’accès et la documentation API sont réservés aux plans Pro.',
			);
		}
	}

	hasFeature(
		plan: SaasBillingPlan,
		feature: keyof Pick<typeof SAAS_PLAN_LIMITS.FREE, 'eInvoicing' | 'prospection' | 'multiUser' | 'publicApi'>,
	): boolean {
		return SAAS_PLAN_LIMITS[plan][feature];
	}
}
