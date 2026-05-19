import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SaasBillingPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SAAS_PLAN_LIMITS } from './saas-plan.limits';

@Injectable()
export class BillingService {
	constructor(private readonly prisma: PrismaService) {}

	private monthBounds(): { start: Date; end: Date } {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
		return { start, end };
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
		const plan = await this.getOrganizationPlan(organizationId);
		const limits = SAAS_PLAN_LIMITS[plan];
		const invoicesThisMonth = await this.countInvoicesThisMonth(organizationId);
		const max = limits.maxInvoicesPerMonth;

		return {
			plan,
			planLabel: limits.label,
			limits,
			usage: {
				invoicesThisMonth,
			},
			remainingInvoices:
				max == null ? null : Math.max(0, max - invoicesThisMonth),
			atLimit: max != null && invoicesThisMonth >= max,
		};
	}

	/** Bloque la création de facture si quota Free dépassé. */
	async assertCanCreateInvoice(organizationId: number): Promise<void> {
		const usage = await this.getUsage(organizationId);
		if (usage.atLimit) {
			throw new ForbiddenException(
				`Quota mensuel atteint (${usage.limits.maxInvoicesPerMonth} factures sur le plan ${usage.planLabel}). Passez au plan Pro pour continuer.`,
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

	hasFeature(plan: SaasBillingPlan, feature: keyof Pick<typeof SAAS_PLAN_LIMITS.FREE, 'eInvoicing' | 'prospection' | 'multiUser'>): boolean {
		return SAAS_PLAN_LIMITS[plan][feature];
	}
}
