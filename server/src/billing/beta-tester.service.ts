import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { SaasBillingPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { assertBetaCodeFormat, normalizeBetaCode } from './beta-tester-code.util';
import { readBetaTesterConfig } from './beta-tester.config';

export interface BetaInviteValidation {
	valid: boolean;
	message: string;
	remainingSlots: number | null;
}

export interface BetaInviteRedemption {
	plan: SaasBillingPlan;
	planLabel: string;
	expiresAt: string;
	durationDays: number;
}

export interface BetaProgramPublicStats {
	maxSlots: number;
	enrolledCount: number;
	remainingSlots: number;
	activeBetaCount: number;
	durationDays: number;
	programEndsAt: string | null;
	programOpen: boolean;
	codeMinLength: number;
	codeMaxLength: number;
	campaignCodes: Array<{
		code: string;
		label: string | null;
		redemptionCount: number;
		maxRedemptions: number | null;
		expiresAt: string | null;
	}>;
}

/**
 * Programme beta testeurs : codes courts réutilisables (réseaux sociaux),
 * plafond global de testeurs, durée d'accès configurable.
 */
@Injectable()
export class BetaTesterService {
	private readonly logger = new Logger(BetaTesterService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly email: EmailService,
	) {}

	/**
	 * Normalise un code saisi.
	 *
	 * @param code - Code brut
	 */
	normalizeCode(code: string): string {
		return normalizeBetaCode(code);
	}

	/**
	 * Nombre d'organisations ayant activé le programme beta au moins une fois.
	 */
	async countEnrolledBetaTesters(): Promise<number> {
		return this.prisma.organization.count({
			where: { betaTesterAt: { not: null } },
		});
	}

	/**
	 * Testeurs beta dont la période d'accès n'est pas expirée.
	 */
	async countActiveBetaTesters(): Promise<number> {
		return this.prisma.organization.count({
			where: {
				betaTesterAt: { not: null },
				saasPlanExpiresAt: { gt: new Date() },
			},
		});
	}

	/**
	 * Le programme accepte-t-il encore de nouvelles inscriptions ?
	 */
	isProgramOpen(config = readBetaTesterConfig()): boolean {
		if (config.programEndsAt && config.programEndsAt < new Date()) {
			return false;
		}
		return true;
	}

	async getRemainingGlobalSlots(): Promise<number> {
		const config = readBetaTesterConfig();
		if (!this.isProgramOpen(config)) return 0;
		const enrolled = await this.countEnrolledBetaTesters();
		return Math.max(0, config.maxSlots - enrolled);
	}

	/**
	 * Statistiques publiques pour le site marketing et la CLI.
	 */
	async getPublicStats(): Promise<BetaProgramPublicStats> {
		const config = readBetaTesterConfig();
		const [enrolledCount, activeBetaCount, codes] = await Promise.all([
			this.countEnrolledBetaTesters(),
			this.countActiveBetaTesters(),
			this.prisma.betaInviteCode.findMany({
				where: { active: true },
				orderBy: { code: 'asc' },
				select: {
					code: true,
					label: true,
					redemptionCount: true,
					maxRedemptions: true,
					expiresAt: true,
				},
			}),
		]);

		const programOpen = this.isProgramOpen(config);
		const remainingSlots = programOpen
			? Math.max(0, config.maxSlots - enrolledCount)
			: 0;

		const now = new Date();
		const campaignCodes = codes
			.filter((c) => !c.expiresAt || c.expiresAt > now)
			.map((c) => ({
				code: c.code,
				label: c.label,
				redemptionCount: c.redemptionCount,
				maxRedemptions: c.maxRedemptions,
				expiresAt: c.expiresAt?.toISOString() ?? null,
			}));

		return {
			maxSlots: config.maxSlots,
			enrolledCount,
			remainingSlots,
			activeBetaCount,
			durationDays: config.durationDays,
			programEndsAt: config.programEndsAt?.toISOString() ?? null,
			programOpen,
			codeMinLength: config.codeMinLength,
			codeMaxLength: config.codeMaxLength,
			campaignCodes,
		};
	}

	/**
	 * Vérifie si un code peut être utilisé (sans authentification).
	 *
	 * @param code - Code d'invitation
	 */
	async validateCode(code: string): Promise<BetaInviteValidation> {
		const config = readBetaTesterConfig();
		const normalized = this.normalizeCode(code);
		if (!normalized) {
			return { valid: false, message: 'Code d\'invitation requis.', remainingSlots: null };
		}

		const remainingSlots = await this.getRemainingGlobalSlots();
		if (!this.isProgramOpen(config)) {
			return {
				valid: false,
				message: 'Le programme beta testeurs est terminé.',
				remainingSlots: 0,
			};
		}
		if (remainingSlots <= 0) {
			return {
				valid: false,
				message: 'Le programme beta testeurs est complet pour le moment.',
				remainingSlots: 0,
			};
		}

		if (!/^[A-Z0-9]+$/.test(normalized)) {
			return {
				valid: false,
				message: 'Le code ne peut contenir que des lettres et des chiffres.',
				remainingSlots,
			};
		}
		if (normalized.length < config.codeMinLength || normalized.length > config.codeMaxLength) {
			return {
				valid: false,
				message: `Le code doit faire entre ${config.codeMinLength} et ${config.codeMaxLength} caractères.`,
				remainingSlots,
			};
		}

		const invite = await this.prisma.betaInviteCode.findUnique({
			where: { code: normalized },
		});
		if (!invite) {
			return { valid: false, message: 'Code d\'invitation inconnu.', remainingSlots };
		}
		if (!invite.active) {
			return { valid: false, message: 'Ce code n\'est plus actif.', remainingSlots };
		}
		if (invite.expiresAt && invite.expiresAt < new Date()) {
			return { valid: false, message: 'Ce code d\'invitation a expiré.', remainingSlots };
		}
		if (invite.maxRedemptions != null && invite.redemptionCount >= invite.maxRedemptions) {
			return {
				valid: false,
				message: 'Ce code a atteint son nombre maximum d\'inscriptions.',
				remainingSlots,
			};
		}

		return {
			valid: true,
			message: `Accès complet gratuit pendant ${config.durationDays} jours (${remainingSlots} place(s) restante(s) au programme).`,
			remainingSlots,
		};
	}

	/**
	 * Active l'offre beta pour une organisation avec un code valide.
	 *
	 * @param code - Code d'invitation
	 * @param organizationId - Organisation cible
	 */
	async redeemCode(code: string, organizationId: number): Promise<BetaInviteRedemption> {
		const config = readBetaTesterConfig();
		const normalized = this.normalizeCode(code);
		assertBetaCodeFormat(normalized, config.codeMinLength, config.codeMaxLength);

		if (!this.isProgramOpen(config)) {
			throw new ForbiddenException('Le programme beta testeurs est terminé.');
		}

		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: {
				id: true,
				saasPlan: true,
				betaTesterAt: true,
				stripeSubscriptionId: true,
			},
		});
		if (!org) throw new NotFoundException('Organisation introuvable');

		if (org.betaTesterAt) {
			throw new ConflictException('Cette organisation a déjà bénéficié du programme beta.');
		}
		if (org.saasPlan !== SaasBillingPlan.FREE) {
			throw new ForbiddenException(
				'Le code beta est réservé aux comptes sur le plan Free (sans abonnement actif).',
			);
		}
		if (org.stripeSubscriptionId) {
			throw new ForbiddenException(
				'Un abonnement Stripe est déjà lié à ce compte. Utilisez le portail client pour gérer votre offre.',
			);
		}

		const enrolled = await this.countEnrolledBetaTesters();
		if (enrolled >= config.maxSlots) {
			throw new ForbiddenException('Le programme beta testeurs est complet pour le moment.');
		}

		const invite = await this.prisma.betaInviteCode.findUnique({
			where: { code: normalized },
		});
		if (!invite) {
			throw new BadRequestException('Code d\'invitation inconnu.');
		}
		if (!invite.active) {
			throw new BadRequestException('Ce code n\'est plus actif.');
		}
		if (invite.expiresAt && invite.expiresAt < new Date()) {
			throw new BadRequestException('Ce code d\'invitation a expiré.');
		}
		if (invite.maxRedemptions != null && invite.redemptionCount >= invite.maxRedemptions) {
			throw new ForbiddenException('Ce code a atteint son nombre maximum d\'inscriptions.');
		}

		const now = new Date();
		const expiresAt = new Date(now);
		expiresAt.setDate(expiresAt.getDate() + config.durationDays);

		await this.prisma.$transaction([
			this.prisma.betaInviteRedemption.create({
				data: {
					betaInviteCodeId: invite.id,
					organizationId,
					redeemedAt: now,
				},
			}),
			this.prisma.betaInviteCode.update({
				where: { id: invite.id },
				data: { redemptionCount: { increment: 1 } },
			}),
			this.prisma.organization.update({
				where: { id: organizationId },
				data: {
					betaTesterAt: now,
					saasPlan: config.grantedPlan,
					saasPlanExpiresAt: expiresAt,
					saasSubscriptionStatus: 'beta_tester',
				},
			}),
		]);

		this.logger.log(
			`Beta activé org ${organizationId} avec code ${normalized}, fin ${expiresAt.toISOString()}`,
		);

		const redemption: BetaInviteRedemption = {
			plan: config.grantedPlan,
			planLabel: this.planLabel(config.grantedPlan),
			expiresAt: expiresAt.toISOString(),
			durationDays: config.durationDays,
		};

		void this.sendWelcomeEmail(organizationId, normalized, redemption).catch((err) => {
			this.logger.warn(
				`Email bienvenue beta non envoyé (org ${organizationId})`,
				err instanceof Error ? err.message : err,
			);
		});

		return redemption;
	}

	/**
	 * Envoie l'email de bienvenue beta si pas encore envoyé (idempotent).
	 *
	 * @param organizationId - Organisation beta
	 * @param inviteCode - Code campagne activé (optionnel)
	 * @param redemption - Détails plan / expiration (sinon relus en base)
	 * @param force - Renvoyer même si déjà marqué comme envoyé
	 */
	async sendWelcomeEmail(
		organizationId: number,
		inviteCode?: string | null,
		redemption?: BetaInviteRedemption,
		force = false,
	): Promise<{ sent: boolean; reason?: string }> {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: {
				betaTesterAt: true,
				betaWelcomeEmailSentAt: true,
				saasPlanExpiresAt: true,
				saasPlan: true,
			},
		});
		if (!org?.betaTesterAt) {
			return { sent: false, reason: 'not_beta_tester' };
		}
		if (org.betaWelcomeEmailSentAt && !force) {
			return { sent: false, reason: 'already_sent' };
		}

		const recipient = await this.resolveOrganizationContact(organizationId);
		if (!recipient) {
			return { sent: false, reason: 'no_email' };
		}

		const config = readBetaTesterConfig();
		const planLabel =
			redemption?.planLabel ??
			this.planLabel(org.saasPlan !== SaasBillingPlan.FREE ? org.saasPlan : config.grantedPlan);
		const expiresAt =
			redemption?.expiresAt ??
			org.saasPlanExpiresAt?.toISOString() ??
			new Date().toISOString();
		const durationDays = redemption?.durationDays ?? config.durationDays;

		const appBase =
			process.env.FRONTEND_URL?.trim() ||
			process.env.PUBLIC_APP_URL?.trim() ||
			'https://prestafacture.com';

		await this.email.sendBetaTesterWelcome({
			to: recipient.email,
			firstName: recipient.firstName,
			planLabel,
			durationDays,
			expiresAt,
			inviteCode,
			surveyUrl: config.surveyUrl,
			appUrl: appBase.replace(/\/$/, ''),
			settingsUrl: `${appBase.replace(/\/$/, '')}/parametres/entreprise`,
			replyTo: config.replyEmail,
		});

		await this.prisma.organization.update({
			where: { id: organizationId },
			data: { betaWelcomeEmailSentAt: new Date() },
		});

		this.logger.log(`Email bienvenue beta envoyé à ${recipient.email} (org ${organizationId})`);
		return { sent: true };
	}

	/**
	 * Résout l'email destinataire (org puis admin, y compris compte PENDING).
	 */
	async getOrganizationContact(
		organizationId: number,
	): Promise<{ email: string; firstName?: string | null } | null> {
		return this.resolveOrganizationContact(organizationId);
	}

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

	/**
	 * Résumé beta pour l'API usage (null si pas beta ou période expirée).
	 */
	async getBetaTesterStatus(organizationId: number): Promise<{
		active: boolean;
		startedAt: string | null;
		expiresAt: string | null;
		daysRemaining: number | null;
	} | null> {
		const org = await this.prisma.organization.findUnique({
			where: { id: organizationId },
			select: { betaTesterAt: true, saasPlanExpiresAt: true, saasPlan: true },
		});
		if (!org?.betaTesterAt) return null;

		const expiresAt = org.saasPlanExpiresAt;
		const now = Date.now();
		const active =
			org.saasPlan !== SaasBillingPlan.FREE &&
			expiresAt != null &&
			expiresAt.getTime() > now;

		const daysRemaining =
			active && expiresAt
				? Math.max(0, Math.ceil((expiresAt.getTime() - now) / (24 * 60 * 60 * 1000)))
				: 0;

		return {
			active,
			startedAt: org.betaTesterAt.toISOString(),
			expiresAt: expiresAt?.toISOString() ?? null,
			daysRemaining: active ? daysRemaining : 0,
		};
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
