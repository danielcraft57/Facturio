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

/**
 * Gestion du programme beta testeurs : codes d'invitation, plafond global,
 * activation de 3 mois d'accès complet sans Stripe.
 */
@Injectable()
export class BetaTesterService {
	private readonly logger = new Logger(BetaTesterService.name);

	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Normalise un code saisi par l'utilisateur.
	 *
	 * @param code - Code brut
	 * @returns Code en majuscules sans espaces
	 */
	normalizeCode(code: string): string {
		return code.trim().toUpperCase().replace(/\s+/g, '');
	}

	/**
	 * Compte les codes déjà utilisés (places beta consommées).
	 */
	async countRedeemedCodes(): Promise<number> {
		return this.prisma.betaInviteCode.count({
			where: { redeemedAt: { not: null } },
		});
	}

	/**
	 * Vérifie si un code peut encore être utilisé (sans authentification).
	 *
	 * @param code - Code d'invitation
	 */
	async validateCode(code: string): Promise<BetaInviteValidation> {
		const config = readBetaTesterConfig();
		const normalized = this.normalizeCode(code);
		if (!normalized) {
			return { valid: false, message: 'Code d\'invitation requis.', remainingSlots: null };
		}

		const redeemedCount = await this.countRedeemedCodes();
		const remainingSlots = Math.max(0, config.maxSlots - redeemedCount);
		if (remainingSlots <= 0) {
			return {
				valid: false,
				message: 'Le programme beta testeurs est complet pour le moment.',
				remainingSlots: 0,
			};
		}

		const invite = await this.prisma.betaInviteCode.findUnique({
			where: { code: normalized },
		});
		if (!invite) {
			return { valid: false, message: 'Code d\'invitation inconnu.', remainingSlots };
		}
		if (invite.redeemedAt) {
			return { valid: false, message: 'Ce code a déjà été utilisé.', remainingSlots };
		}
		if (invite.expiresAt && invite.expiresAt < new Date()) {
			return { valid: false, message: 'Ce code d\'invitation a expiré.', remainingSlots };
		}

		return {
			valid: true,
			message: `Accès complet gratuit pendant ${config.durationDays} jours.`,
			remainingSlots,
		};
	}

	/**
	 * Active l'offre beta pour une organisation avec un code valide.
	 *
	 * @param code - Code d'invitation
	 * @param organizationId - Organisation cible
	 * @throws {BadRequestException} Code invalide ou expiré
	 * @throws {ConflictException} Code déjà utilisé ou org déjà beta
	 * @throws {ForbiddenException} Plafond global atteint ou org non éligible
	 */
	async redeemCode(code: string, organizationId: number): Promise<BetaInviteRedemption> {
		const config = readBetaTesterConfig();
		const normalized = this.normalizeCode(code);
		if (!normalized) {
			throw new BadRequestException('Code d\'invitation requis.');
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

		const redeemedCount = await this.countRedeemedCodes();
		if (redeemedCount >= config.maxSlots) {
			throw new ForbiddenException('Le programme beta testeurs est complet pour le moment.');
		}

		const invite = await this.prisma.betaInviteCode.findUnique({
			where: { code: normalized },
		});
		if (!invite) {
			throw new BadRequestException('Code d\'invitation inconnu.');
		}
		if (invite.redeemedAt) {
			throw new ConflictException('Ce code a déjà été utilisé.');
		}
		if (invite.expiresAt && invite.expiresAt < new Date()) {
			throw new BadRequestException('Ce code d\'invitation a expiré.');
		}

		const now = new Date();
		const expiresAt = new Date(now);
		expiresAt.setDate(expiresAt.getDate() + config.durationDays);

		await this.prisma.$transaction([
			this.prisma.betaInviteCode.update({
				where: { id: invite.id },
				data: {
					redeemedAt: now,
					redeemedOrganizationId: organizationId,
				},
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

		return {
			plan: config.grantedPlan,
			planLabel: this.planLabel(config.grantedPlan),
			expiresAt: expiresAt.toISOString(),
			durationDays: config.durationDays,
		};
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
