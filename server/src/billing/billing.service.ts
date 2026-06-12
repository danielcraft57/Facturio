import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SaasBillingPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SAAS_PLAN_LIMITS, type SaasPlanFeature } from './saas-plan.limits';
import { resolveEffectiveSaasPlan } from './saas-plan.util';
import { BetaTesterService } from './beta-tester.service';

@Injectable()
export class BillingService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly betaTester: BetaTesterService,
	) {}

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
		return resolveEffectiveSaasPlan(org);
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

	async countQuotesThisMonth(organizationId: number): Promise<number> {
		const { start, end } = this.monthBounds();
		return this.prisma.quote.count({
			where: {
				organizationId,
				createdAt: { gte: start, lte: end },
			},
		});
	}

	/**
	 * Compte les emails document envoyés ce mois (facture, devis, dette, relance).
	 */
	async countEmailsSentThisMonth(organizationId: number): Promise<number> {
		const { start, end } = this.monthBounds();
		return this.prisma.emailEvent.count({
			where: {
				type: 'sent',
				createdAt: { gte: start, lte: end },
				OR: [
					{ invoice: { organizationId } },
					{ quote: { organizationId } },
					{ payableDebt: { organizationId } },
				],
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

		const plan = resolveEffectiveSaasPlan(org);

		const limits = SAAS_PLAN_LIMITS[plan];
		const period = this.monthBounds();
		const invoicesThisMonth = await this.countInvoicesThisMonth(organizationId);
		const quotesThisMonth = await this.countQuotesThisMonth(organizationId);
		const emailsSentThisMonth = await this.countEmailsSentThisMonth(organizationId);
		const maxInvoices = limits.maxInvoicesPerMonth;
		const maxQuotes = limits.maxQuotesPerMonth;
		const maxEmails = limits.maxEmailsPerMonth;

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

		const betaTester = await this.betaTester.getBetaTesterStatus(organizationId);
		const planLabel =
			betaTester?.active === true ? `${limits.label} (beta testeur)` : limits.label;

		return {
			plan,
			planLabel,
			limits,
			betaTester,
			usage: {
				invoicesThisMonth,
				quotesThisMonth,
				emailsSentThisMonth,
			},
			/** Période du quota mensuel (factures créées entre periodStart et periodEnd inclus). */
			billingPeriod: {
				start: period.start.toISOString(),
				end: period.end.toISOString(),
				resetsAt: period.resetsAt.toISOString(),
			},
			remainingInvoices: maxInvoices == null ? null : Math.max(0, maxInvoices - invoicesThisMonth),
			remainingQuotes: maxQuotes == null ? null : Math.max(0, maxQuotes - quotesThisMonth),
			remainingEmails: maxEmails == null ? null : Math.max(0, maxEmails - emailsSentThisMonth),
			atLimit: maxInvoices != null && invoicesThisMonth >= maxInvoices,
			atQuoteLimit: maxQuotes != null && quotesThisMonth >= maxQuotes,
			atEmailLimit: maxEmails != null && emailsSentThisMonth >= maxEmails,
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

	/** Bloque la création de devis si quota Free dépassé. */
	async assertCanCreateQuote(organizationId: number): Promise<void> {
		const usage = await this.getUsage(organizationId);
		if (usage.atQuoteLimit) {
			throw new ForbiddenException(
				`Quota mensuel atteint (${usage.limits.maxQuotesPerMonth} devis ce mois-ci sur le plan ${usage.planLabel}). Le compteur est réinitialisé le 1er du mois suivant. Passez au plan Pro pour continuer.`,
			);
		}
	}

	/** Bloque l'envoi d'un email document si quota Free dépassé. */
	async assertCanSendDocumentEmail(organizationId: number): Promise<void> {
		const usage = await this.getUsage(organizationId);
		if (usage.atEmailLimit) {
			throw new ForbiddenException(
				`Quota mensuel d'emails atteint (${usage.limits.maxEmailsPerMonth} envois ce mois-ci sur le plan ${usage.planLabel}). Le compteur est réinitialisé le 1er du mois suivant. Passez au plan Pro pour continuer.`,
			);
		}
	}

	async assertCanUseAccounting(organizationId: number): Promise<void> {
		const plan = await this.getOrganizationPlan(organizationId);
		if (!this.hasFeature(plan, 'accounting')) {
			throw new ForbiddenException(
				'La comptabilité (FEC, balance, grand livre) est réservée au plan Pro.',
			);
		}
	}

	async assertCanUseFinanceModule(organizationId: number): Promise<void> {
		const plan = await this.getOrganizationPlan(organizationId);
		if (!this.hasFeature(plan, 'financeModule')) {
			throw new ForbiddenException(
				'Le suivi des créances et des dettes est réservé au plan Pro.',
			);
		}
	}

	/**
	 * Bloque l'ajout d'un utilisateur supplémentaire si le plan ne permet pas le multi-utilisateur.
	 *
	 * @param organizationId - Organisation cible
	 * @param additionalUsers - Nombre d'utilisateurs à ajouter (défaut 1)
	 */
	async assertCanAddOrganizationUsers(
		organizationId: number,
		additionalUsers = 1,
	): Promise<void> {
		const plan = await this.getOrganizationPlan(organizationId);
		if (this.hasFeature(plan, 'multiUser')) return;

		const currentUsers = await this.prisma.user.count({ where: { organizationId } });
		if (currentUsers + additionalUsers > 1) {
			throw new ForbiddenException(
				'Le plan Free et Pro sont limités à un utilisateur par organisation. Passez au plan Agence pour inviter des collaborateurs.',
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

	hasFeature(plan: SaasBillingPlan, feature: SaasPlanFeature | 'eInvoicing'): boolean {
		return SAAS_PLAN_LIMITS[plan][feature];
	}

	/** Indique si les PDF facture/devis doivent afficher le filigrane Facturio. */
	async shouldWatermarkPdfs(organizationId: number | null | undefined): Promise<boolean> {
		if (organizationId == null) return false;
		const plan = await this.getOrganizationPlan(organizationId);
		return SAAS_PLAN_LIMITS[plan].pdfWatermark;
	}
}
