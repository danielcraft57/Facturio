import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { resolvePublicAppBaseUrl } from '../common/public-app-url';

const ACTIVE_WINDOW_MS = 30 * 60 * 1000; // 30 min — connexion « simultanée »
const VERIFICATION_TTL_MS = 60 * 60 * 1000; // 1 h

export interface LoginDeviceContext {
	ip?: string;
	userAgent?: string;
	deviceFingerprint?: string;
}

export interface SessionCreateResult {
	sessionId: number;
	needDeviceVerification: boolean;
}

export interface SessionCreateOptions {
	/** Connexion OAuth Google : pas de blocage « nouvel appareil » (email déjà validé par Google). */
	trustDevice?: boolean;
}

@Injectable()
export class AuthSessionService {
	private readonly logger = new Logger(AuthSessionService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly emailService: EmailService,
	) {}

	hashIp(ip?: string): string | null {
		if (!ip?.trim()) return null;
		const salt = process.env.SESSION_IP_SALT || 'facturio-session-salt';
		return crypto.createHash('sha256').update(`${salt}:${ip.trim()}`).digest('hex');
	}

	normalizeFingerprint(raw?: string): string {
		const fp = (raw || '').trim().slice(0, 128);
		return fp.length >= 8 ? fp : 'unknown-device';
	}

	async createLoginSession(
		userId: number,
		ctx: LoginDeviceContext,
		options: SessionCreateOptions = {},
	): Promise<SessionCreateResult> {
		const deviceFingerprint = this.normalizeFingerprint(ctx.deviceFingerprint);
		const ipHash = this.hashIp(ctx.ip);
		const userAgent = ctx.userAgent?.slice(0, 512) ?? null;

		const knownTrusted = await this.prisma.userSession.findFirst({
			where: {
				userId,
				deviceFingerprint,
				trusted: true,
				revokedAt: null,
				verifiedAt: { not: null },
			},
		});

		const activeCutoff = new Date(Date.now() - ACTIVE_WINDOW_MS);
		const concurrentOther = await this.prisma.userSession.findFirst({
			where: {
				userId,
				revokedAt: null,
				lastActivityAt: { gte: activeCutoff },
				deviceFingerprint: { not: deviceFingerprint },
				trusted: true,
			},
		});

		const hasOtherDevices = await this.prisma.userSession.findFirst({
			where: {
				userId,
				deviceFingerprint: { notIn: [deviceFingerprint, 'unknown-device'] },
				trusted: true,
				revokedAt: null,
				verifiedAt: { not: null },
			},
		});

		const isRisky = options.trustDevice
			? false
			: !!concurrentOther || (!knownTrusted && !!hasOtherDevices);

		const verificationToken = isRisky ? crypto.randomBytes(32).toString('hex') : null;
		const verificationExpires = isRisky ? new Date(Date.now() + VERIFICATION_TTL_MS) : null;

		const session = await this.prisma.userSession.create({
			data: {
				userId,
				deviceFingerprint,
				userAgent,
				ipHash,
				trusted: !isRisky,
				verifiedAt: isRisky ? null : new Date(),
				verificationToken,
				verificationExpires,
			},
		});

		if (isRisky && verificationToken) {
			const user = await this.prisma.user.findUnique({ where: { id: userId } });
			if (user) {
				const baseUrl = resolvePublicAppBaseUrl();
				const verifyUrl = `${baseUrl}/auth/confirmer-appareil?token=${verificationToken}`;
				await this.emailService.sendDeviceLoginEmail({
					to: user.email,
					firstName: user.firstName,
					verifyUrl,
					userAgent,
				});
				this.logger.warn(
					`Device verification required for userId=${userId} (sessionId=${session.id}, ipHash=${ipHash ?? 'n/a'})`,
				);
			}
		}

		return { sessionId: session.id, needDeviceVerification: isRisky };
	}

	/**
	 * Remplace l'empreinte « unknown-device » (OAuth sans fingerprint) par celle du navigateur.
	 *
	 * @param sessionId - Session JWT courante
	 * @param userId - Utilisateur
	 * @param ctx - Contexte appareil (fingerprint client)
	 */
	async syncSessionFingerprint(
		sessionId: number,
		userId: number,
		ctx: LoginDeviceContext,
	): Promise<void> {
		const fingerprint = this.normalizeFingerprint(ctx.deviceFingerprint);
		if (fingerprint === 'unknown-device') return;

		const session = await this.prisma.userSession.findFirst({
			where: { id: sessionId, userId, revokedAt: null },
		});
		if (!session) return;
		if (session.deviceFingerprint === fingerprint) return;

		const shouldUpgrade =
			session.deviceFingerprint === 'unknown-device' || session.trusted === false;
		if (!shouldUpgrade) return;

		await this.prisma.userSession.update({
			where: { id: sessionId },
			data: {
				deviceFingerprint: fingerprint,
				trusted: true,
				verifiedAt: new Date(),
				verificationToken: null,
				verificationExpires: null,
				lastActivityAt: new Date(),
			},
		});
	}

	async assertSessionActive(sessionId: number, userId: number): Promise<void> {
		const session = await this.prisma.userSession.findFirst({
			where: { id: sessionId, userId, revokedAt: null },
		});
		if (!session) {
			throw new UnauthorizedException('Session expirée ou révoquée. Reconnectez-vous.');
		}
		if (!session.trusted) {
			throw new UnauthorizedException(
				'Connexion depuis un nouvel appareil : vérifiez votre email pour confirmer cette session.',
			);
		}
		await this.prisma.userSession.update({
			where: { id: sessionId },
			data: { lastActivityAt: new Date() },
		});
	}

	async verifyDeviceToken(token: string): Promise<{ userId: number; sessionId: number }> {
		const trimmed = token?.trim();
		if (!trimmed) {
			throw new BadRequestException('Token requis');
		}
		const session = await this.prisma.userSession.findUnique({
			where: { verificationToken: trimmed },
		});
		if (!session || session.revokedAt) {
			throw new BadRequestException('Lien invalide ou déjà utilisé');
		}
		if (session.verificationExpires && session.verificationExpires < new Date()) {
			throw new BadRequestException('Ce lien a expiré. Reconnectez-vous pour recevoir un nouvel email.');
		}

		await this.prisma.userSession.update({
			where: { id: session.id },
			data: {
				trusted: true,
				verifiedAt: new Date(),
				verificationToken: null,
				verificationExpires: null,
				lastActivityAt: new Date(),
			},
		});

		// Révoque les autres sessions actives (évite double connexion)
		await this.prisma.userSession.updateMany({
			where: {
				userId: session.userId,
				id: { not: session.id },
				revokedAt: null,
			},
			data: { revokedAt: new Date() },
		});

		return { userId: session.userId, sessionId: session.id };
	}

	async revokeSession(sessionId: number, userId: number): Promise<void> {
		await this.prisma.userSession.updateMany({
			where: { id: sessionId, userId },
			data: { revokedAt: new Date() },
		});
	}
}
