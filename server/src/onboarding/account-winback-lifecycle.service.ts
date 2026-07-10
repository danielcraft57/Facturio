import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { resolvePublicAppBaseUrl } from '../common/public-app-url';

const MS_48H = 48 * 60 * 60 * 1000;
const MS_72H = 72 * 60 * 60 * 1000;
const MS_7D = 7 * 24 * 60 * 60 * 1000;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Cron quotidien : emails win-back selon l'étape d'abandon (vérif email, onboarding, 1re facture).
 *
 * Désactivable via `ACCOUNT_WINBACK_EMAILS_ENABLED=0` (comme les emails beta).
 */
@Injectable()
export class AccountWinbackLifecycleService {
	private readonly logger = new Logger(AccountWinbackLifecycleService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailService,
	) {}

	/**
	 * Traite les trois étapes de relance une fois par jour à 10 h.
	 */
	@Cron(CronExpression.EVERY_DAY_AT_10AM)
	async processWinbackEmails(): Promise<void> {
		if (process.env.ACCOUNT_WINBACK_EMAILS_ENABLED === '0') return;

		const appBase = resolvePublicAppBaseUrl();

		await this.processUnverifiedUsers(appBase);
		await this.processIncompleteOnboarding(appBase);
		await this.processNoFirstInvoice(appBase);
	}

	/**
	 * Relance les comptes dont l'email n'est pas vérifié 48 h après l'inscription.
	 *
	 * @param appBase - URL publique de l'application
	 */
	private async processUnverifiedUsers(appBase: string): Promise<void> {
		const cutoff = new Date(Date.now() - MS_48H);

		const users = await this.prisma.user.findMany({
			where: {
				emailVerified: false,
				googleId: null,
				winbackVerifyEmailSentAt: null,
				createdAt: { lt: cutoff },
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				emailVerificationToken: true,
				emailVerificationExpires: true,
			},
			take: 100,
		});

		for (const user of users) {
			try {
				const token = await this.ensureVerificationToken(user);
				const verifyUrl = `${appBase}/verifier-email/${token}`;

				await this.email.sendWinbackVerifyEmail({
					to: user.email,
					firstName: user.firstName,
					verifyUrl,
				});

				await this.prisma.user.update({
					where: { id: user.id },
					data: { winbackVerifyEmailSentAt: new Date() },
				});
			} catch (err) {
				this.logger.warn(
					`Winback verify user ${user.id}`,
					err instanceof Error ? err.message : err,
				);
			}
		}
	}

	/**
	 * Relance les organisations dont l'onboarding n'est pas terminé 72 h après vérif email.
	 *
	 * @param appBase - URL publique de l'application
	 */
	private async processIncompleteOnboarding(appBase: string): Promise<void> {
		const cutoff = new Date(Date.now() - MS_72H);

		const orgs = await this.prisma.organization.findMany({
			where: {
				onboardingCompletedAt: null,
				winbackOnboardingSentAt: null,
				users: {
					some: {
						emailVerified: true,
						emailVerifiedAt: { lt: cutoff },
					},
				},
			},
			select: { id: true },
			take: 100,
		});

		for (const org of orgs) {
			try {
				const contact = await this.resolveOrganizationContact(org.id);
				if (!contact) continue;

				await this.email.sendWinbackOnboarding({
					to: contact.email,
					firstName: contact.firstName,
					onboardingUrl: `${appBase}/installation`,
					dashboardUrl: `${appBase}/dashboard`,
				});

				await this.prisma.organization.update({
					where: { id: org.id },
					data: { winbackOnboardingSentAt: new Date() },
				});
			} catch (err) {
				this.logger.warn(
					`Winback onboarding org ${org.id}`,
					err instanceof Error ? err.message : err,
				);
			}
		}
	}

	/**
	 * Relance les organisations sans facture 7 jours après onboarding terminé.
	 *
	 * @param appBase - URL publique de l'application
	 */
	private async processNoFirstInvoice(appBase: string): Promise<void> {
		const cutoff = new Date(Date.now() - MS_7D);

		const orgs = await this.prisma.organization.findMany({
			where: {
				onboardingCompletedAt: { lt: cutoff },
				winbackFirstInvoiceSentAt: null,
				invoices: { none: {} },
			},
			select: { id: true },
			take: 100,
		});

		for (const org of orgs) {
			try {
				const contact = await this.resolveOrganizationContact(org.id);
				if (!contact) continue;

				await this.email.sendWinbackFirstInvoice({
					to: contact.email,
					firstName: contact.firstName,
					createInvoiceUrl: `${appBase}/factures/inbox?create=1`,
					dashboardUrl: `${appBase}/dashboard`,
				});

				await this.prisma.organization.update({
					where: { id: org.id },
					data: { winbackFirstInvoiceSentAt: new Date() },
				});
			} catch (err) {
				this.logger.warn(
					`Winback first invoice org ${org.id}`,
					err instanceof Error ? err.message : err,
				);
			}
		}
	}

	/**
	 * Régénère un token de vérification si absent ou expiré.
	 *
	 * @param user - Utilisateur cible
	 * @returns Token valide 24 h
	 */
	private async ensureVerificationToken(user: {
		id: number;
		emailVerificationToken: string | null;
		emailVerificationExpires: Date | null;
	}): Promise<string> {
		const now = Date.now();
		if (
			user.emailVerificationToken &&
			user.emailVerificationExpires &&
			user.emailVerificationExpires.getTime() > now
		) {
			return user.emailVerificationToken;
		}

		const token = crypto.randomBytes(32).toString('hex');
		const expires = new Date(now + VERIFY_TOKEN_TTL_MS);

		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				emailVerificationToken: token,
				emailVerificationExpires: expires,
			},
		});

		return token;
	}

	/**
	 * Résout l'email de contact d'une organisation (email org ou premier admin).
	 *
	 * @param organizationId - ID organisation
	 * @returns Email et prénom, ou null si introuvable
	 */
	private async resolveOrganizationContact(
		organizationId: number,
	): Promise<{ email: string; firstName?: string | null } | null> {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: { email: true },
		});
		if (org?.email?.trim()) {
			return { email: org.email.trim(), firstName: null };
		}

		const admin = await this.prisma.user.findFirst({
			where: { organizationId, role: 'ADMIN' },
			orderBy: { id: 'asc' },
			select: { email: true, firstName: true },
		});
		if (!admin?.email?.trim()) return null;

		return { email: admin.email.trim(), firstName: admin.firstName };
	}
}
