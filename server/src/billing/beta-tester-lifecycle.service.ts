import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SaasBillingPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { BetaTesterService } from './beta-tester.service';

type BetaReminderPhase = '60d' | '30d' | '7d';

/**
 * Cron quotidien : emails rappel fin période beta et notification expiration.
 */
@Injectable()
export class BetaTesterLifecycleService {
	private readonly logger = new Logger(BetaTesterLifecycleService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailService,
		private readonly betaTester: BetaTesterService,
	) {}

	@Cron(CronExpression.EVERY_DAY_AT_9AM)
	async processBetaLifecycleEmails(): Promise<void> {
		if (process.env.BETA_LIFECYCLE_EMAILS_ENABLED === '0') return;

		const orgs = await this.prisma.organization.findMany({
			where: { betaTesterAt: { not: null } },
			select: {
				id: true,
				saasPlan: true,
				saasPlanExpiresAt: true,
				betaReminder60SentAt: true,
				betaReminder30SentAt: true,
				betaReminder7SentAt: true,
				betaExpiredNoticeSentAt: true,
			},
		});

		const appBase = (
			process.env.FRONTEND_URL?.trim() ||
			process.env.PUBLIC_APP_URL?.trim() ||
			'https://facturio.danielcraft.fr'
		).replace(/\/$/, '');

		for (const org of orgs) {
			try {
				await this.processOrganization(org, appBase);
			} catch (err) {
				this.logger.warn(
					`Lifecycle beta org ${org.id}`,
					err instanceof Error ? err.message : err,
				);
			}
		}
	}

	private async processOrganization(
		org: {
			id: number;
			saasPlan: SaasBillingPlan;
			saasPlanExpiresAt: Date | null;
			betaReminder60SentAt: Date | null;
			betaReminder30SentAt: Date | null;
			betaReminder7SentAt: Date | null;
			betaExpiredNoticeSentAt: Date | null;
		},
		appBase: string,
	): Promise<void> {
		const contact = await this.betaTester.getOrganizationContact(org.id);
		if (!contact) return;

		const expiresAt = org.saasPlanExpiresAt;
		const now = Date.now();
		const active =
			org.saasPlan !== SaasBillingPlan.FREE &&
			expiresAt != null &&
			expiresAt.getTime() > now;

		if (active && expiresAt) {
			const daysRemaining = Math.ceil((expiresAt.getTime() - now) / (24 * 60 * 60 * 1000));
			const planLabel = this.planLabel(org.saasPlan);

			if (daysRemaining <= 60 && daysRemaining > 30 && !org.betaReminder60SentAt) {
				await this.sendReminder(org.id, '60d', contact, planLabel, expiresAt, daysRemaining, appBase);
				await this.prisma.organization.update({
					where: { id: org.id },
					data: { betaReminder60SentAt: new Date() },
				});
				return;
			}
			if (daysRemaining <= 30 && daysRemaining > 7 && !org.betaReminder30SentAt) {
				await this.sendReminder(org.id, '30d', contact, planLabel, expiresAt, daysRemaining, appBase);
				await this.prisma.organization.update({
					where: { id: org.id },
					data: { betaReminder30SentAt: new Date() },
				});
				return;
			}
			if (daysRemaining <= 7 && daysRemaining > 0 && !org.betaReminder7SentAt) {
				await this.sendReminder(org.id, '7d', contact, planLabel, expiresAt, daysRemaining, appBase);
				await this.prisma.organization.update({
					where: { id: org.id },
					data: { betaReminder7SentAt: new Date() },
				});
			}
			return;
		}

		if (!active && !org.betaExpiredNoticeSentAt) {
			await this.email.sendBetaTrialExpired({
				to: contact.email,
				firstName: contact.firstName,
				billingUrl: `${appBase}/parametres/abonnement`,
				quotasUrl: `${appBase}/parametres/quotas`,
			});
			await this.prisma.organization.update({
				where: { id: org.id },
				data: { betaExpiredNoticeSentAt: new Date() },
			});
			this.logger.log(`Email fin beta envoyé org ${org.id}`);
		}
	}

	private async sendReminder(
		orgId: number,
		phase: BetaReminderPhase,
		contact: { email: string; firstName?: string | null },
		planLabel: string,
		expiresAt: Date,
		daysRemaining: number,
		appBase: string,
	): Promise<void> {
		await this.email.sendBetaTrialReminder({
			to: contact.email,
			firstName: contact.firstName,
			phase,
			planLabel,
			expiresAt,
			daysRemaining,
			billingUrl: `${appBase}/parametres/abonnement`,
			dashboardUrl: `${appBase}/dashboard`,
		});
		this.logger.log(`Email rappel beta ${phase} org ${orgId}`);
	}

	private planLabel(plan: SaasBillingPlan): string {
		switch (plan) {
			case SaasBillingPlan.AGENCY:
				return 'Agence (beta)';
			case SaasBillingPlan.PRO_EFACTURE:
				return 'Pro + e-facture (beta)';
			case SaasBillingPlan.PRO:
				return 'Pro (beta)';
			default:
				return 'Beta';
		}
	}
}
