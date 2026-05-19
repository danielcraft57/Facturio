import { Injectable, BadRequestException, UnauthorizedException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthSessionService, type LoginDeviceContext } from './auth-session.service';

/**
 * Service d'authentification
 * 
 * Gère :
 * - L'inscription (signup) avec création d'organisation
 * - La connexion (login) avec vérification du mot de passe
 * - L'authentification Google OAuth
 * - La génération de tokens JWT
 * - La gestion des sessions via cookies
 * 
 * @see AuthController pour les endpoints API
 */
@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
		private emailService: EmailService,
		private authSessionService: AuthSessionService,
	) {}

	private readonly logger = new Logger(AuthService.name);

	/**
	 * Inscription d'un nouvel utilisateur
	 * 
	 * Crée :
	 * 1. Une nouvelle organisation
	 * 2. Un utilisateur avec rôle ADMIN (premier utilisateur)
	 * 3. Hash le mot de passe avec bcrypt (12 rounds)
	 * 
	 * @param data - Données d'inscription (email, password, firstName, lastName, organizationName)
	 * @returns Token JWT et informations utilisateur
	 * @throws {ConflictException} Si l'email existe déjà
	 * 
	 * @example
	 * ```typescript
	 * const result = await authService.signup({
	 *   email: 'user@example.com',
	 *   password: 'password123',
	 *   firstName: 'John',
	 *   lastName: 'Doe',
	 *   organizationName: 'My Company'
	 * });
	 * // result.access_token = JWT token
	 * // result.user = { id, email, firstName, lastName, role, organization }
	 * ```
	 */
	async signup(data: SignupDto) {
		this.logger.log(`Signup attempt for ${data.email}`);
		const existingUser = await this.prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existingUser) {
			this.logger.warn(`Signup failed for ${data.email}: email already used`);
			throw new ConflictException('Cet email est déjà utilisé');
		}

		const hashedPassword = await bcrypt.hash(data.password, 12);
		const organization = await this.prisma.organization.create({
			data: {
				name: data.organizationName,
				companyType: 'B2B',
			},
		});

		const verificationToken = crypto.randomBytes(32).toString('hex');
		const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

		const consentAt = new Date();
		const user = await this.prisma.user.create({
			data: {
				email: data.email,
				password: hashedPassword,
				firstName: data.firstName,
				lastName: data.lastName,
				organizationId: organization.id,
				status: 'PENDING',
				emailVerified: false,
				emailVerifiedAt: null,
				emailVerificationToken: verificationToken,
				emailVerificationExpires: verificationExpires,
				role: 'ADMIN',
				termsAcceptedAt: data.acceptTerms ? consentAt : null,
				privacyConsentAt: data.acceptPrivacy ? consentAt : null,
			},
			include: { organization: true },
		});

		const baseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || 'http://localhost:5173';
		const verifyUrl = `${baseUrl}/verifier-email/${verificationToken}`;
		await this.emailService.sendVerifyEmail({
			to: user.email,
			firstName: user.firstName,
			verifyUrl,
		});

		this.logger.log(`Signup success for ${data.email}, verification email sent (userId=${user.id})`);
		return {
			message: 'Un email de confirmation vous a été envoyé. Cliquez sur le lien pour activer votre compte.',
			needVerification: true,
		};
	}

	/**
	 * Connexion d'un utilisateur existant
	 * 
	 * Vérifie :
	 * - L'existence de l'utilisateur
	 * - La validité du mot de passe (bcrypt)
	 * - Le statut du compte (doit être ACTIVE)
	 * 
	 * Met à jour la date de dernière connexion.
	 * 
	 * @param data - Données de connexion (email, password)
	 * @returns Token JWT et informations utilisateur
	 * @throws {UnauthorizedException} Si email/mot de passe incorrect ou compte inactif
	 * 
	 * @example
	 * ```typescript
	 * const result = await authService.login({
	 *   email: 'user@example.com',
	 *   password: 'password123'
	 * });
	 * ```
	 */
	async login(data: LoginDto, deviceContext: LoginDeviceContext = {}) {
		this.logger.log(`Login attempt for ${data.email}`);
		const user = await this.prisma.user.findUnique({
			where: { email: data.email },
			include: { organization: true },
		});

		if (!user) {
			this.logger.warn(`Login failed for ${data.email}: user not found`);
			throw new UnauthorizedException('Email ou mot de passe incorrect');
		}

		if (!user.password) {
			this.logger.warn(`Login failed for ${data.email}: password is null (Google-only account)`);
			throw new UnauthorizedException('Veuillez vous connecter avec Google');
		}

		const isPasswordValid = await bcrypt.compare(data.password, user.password);

		if (!isPasswordValid) {
			this.logger.warn(`Login failed for ${data.email}: invalid password`);
			throw new UnauthorizedException('Email ou mot de passe incorrect');
		}

		if (user.status !== 'ACTIVE') {
			this.logger.warn(`Login failed for ${data.email}: status=${user.status}`);
			if (user.status === 'PENDING' && !user.emailVerified) {
				throw new UnauthorizedException('Veuillez vérifier votre adresse email. Consultez votre boîte de réception ou demandez un nouvel email de confirmation.');
			}
			throw new UnauthorizedException('Compte non actif');
		}

		if (!user.emailVerified) {
			this.logger.warn(`Login failed for ${data.email}: email not verified`);
			throw new UnauthorizedException('Veuillez vérifier votre adresse email. Consultez votre boîte de réception ou demandez un nouvel email de confirmation.');
		}

		// Mettre à jour dernière connexion
		await this.prisma.user.update({
			where: { id: user.id },
			data: { lastLoginAt: new Date() },
		});

		this.logger.log(`Login success for ${data.email} (userId=${user.id})`);
		return this.finishLogin(user, {
			...deviceContext,
			deviceFingerprint: data.deviceFingerprint ?? deviceContext.deviceFingerprint,
		});
	}

	async finishLogin(user: any, ctx: LoginDeviceContext) {
		const { sessionId, needDeviceVerification } = await this.authSessionService.createLoginSession(
			user.id,
			ctx,
		);
		if (needDeviceVerification) {
			return {
				needDeviceVerification: true as const,
				message:
					'Connexion depuis un nouvel appareil ou une session active ailleurs. Consultez votre email pour confirmer.',
				email: this.maskEmail(user.email),
			};
		}
		return this.generateTokens(user, sessionId);
	}

	async completeDeviceVerification(token: string) {
		const { userId, sessionId } = await this.authSessionService.verifyDeviceToken(token);
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			include: { organization: true },
		});
		if (!user || user.status !== 'ACTIVE') {
			throw new BadRequestException('Compte introuvable ou inactif');
		}
		return this.generateTokens(user, sessionId);
	}

	async bootstrapSession(user: any, ctx: LoginDeviceContext) {
		let sessionId = user.sessionId as number | undefined;
		if (!sessionId) {
			const created = await this.authSessionService.createLoginSession(user.id, ctx);
			if (created.needDeviceVerification) {
				return {
					needDeviceVerification: true as const,
					message:
						'Confirmez cette connexion via le lien envoyé par email avant d\'accéder au tableau de bord.',
					email: this.maskEmail(user.email),
				};
			}
			sessionId = created.sessionId;
		} else {
			await this.authSessionService.assertSessionActive(sessionId, user.id);
		}
		return this.generateTokens(user, sessionId);
	}

	async revokeCurrentSession(sessionId: number, userId: number): Promise<void> {
		await this.authSessionService.revokeSession(sessionId, userId);
	}

	async revokeFromRequest(req: Request): Promise<void> {
		const cookieToken = req.cookies?.['access_token'];
		const authHeader = req.headers.authorization;
		const bearer =
			typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
				? authHeader.slice(7)
				: undefined;
		const token = cookieToken || bearer;
		if (!token) return;
		try {
			const payload = this.jwtService.verify(token) as { sub?: number; sid?: number };
			if (payload.sid && payload.sub) {
				await this.authSessionService.revokeSession(payload.sid, payload.sub);
			}
		} catch {
			// Token expiré ou invalide
		}
	}

	private maskEmail(email: string): string {
		const [local, domain] = email.split('@');
		if (!domain) return '***';
		const visible = local.length <= 2 ? local[0] : local.slice(0, 2);
		return `${visible}***@${domain}`;
	}

	/**
	 * Valide et crée/connecte un utilisateur via Google OAuth
	 * 
	 * Logique :
	 * 1. Cherche un utilisateur existant par googleId
	 * 2. Si non trouvé, cherche par email
	 * 3. Si trouvé par email, lie le compte Google
	 * 4. Si aucun compte, crée un nouvel utilisateur avec organisation
	 * 
	 * @param googleUser - Données utilisateur depuis Google OAuth
	 * @returns Token JWT et informations utilisateur
	 * 
	 * @example
	 * ```typescript
	 * const result = await authService.validateGoogleUser({
	 *   googleId: '123456789',
	 *   email: 'user@gmail.com',
	 *   firstName: 'John',
	 *   lastName: 'Doe',
	 *   avatar: 'https://...'
	 * });
	 * ```
	 */
	async validateGoogleUser(googleUser: any, deviceContext: LoginDeviceContext = {}) {
		// Chercher utilisateur existant par googleId
		let user = await this.prisma.user.findUnique({
			where: { googleId: googleUser.googleId },
			include: { organization: true },
		});

		if (user) {
			// Mettre à jour dernière connexion
			await this.prisma.user.update({
				where: { id: user.id },
				data: { lastLoginAt: new Date() },
			});
			return this.finishLogin(user, deviceContext);
		}

		// Chercher par email si pas de googleId
		user = await this.prisma.user.findUnique({
			where: { email: googleUser.email },
			include: { organization: true },
		});

		if (user) {
			// Lier compte Google à compte existant
			user = await this.prisma.user.update({
				where: { id: user.id },
				data: {
					googleId: googleUser.googleId,
					googleEmail: googleUser.email,
					googlePicture: googleUser.avatar,
					emailVerified: true,
					emailVerifiedAt: new Date(),
					lastLoginAt: new Date(),
					// Mettre à jour nom et avatar si vides
					firstName: user.firstName || googleUser.firstName,
					lastName: user.lastName || googleUser.lastName,
					avatar: user.avatar || googleUser.avatar,
				},
				include: { organization: true },
			});
			return this.finishLogin(user, deviceContext);
		}

		// Créer nouvel utilisateur avec organisation par défaut
		const organization = await this.prisma.organization.create({
			data: {
				name: googleUser.email.split('@')[0] + ' Organization',
				companyType: 'B2B',
			},
		});

		user = await this.prisma.user.create({
			data: {
				email: googleUser.email,
				googleId: googleUser.googleId,
				googleEmail: googleUser.email,
				googlePicture: googleUser.avatar,
				firstName: googleUser.firstName,
				lastName: googleUser.lastName,
				avatar: googleUser.avatar,
				organizationId: organization.id,
				status: 'ACTIVE',
				emailVerified: true,
				emailVerifiedAt: new Date(),
				role: 'ADMIN',
			},
			include: { organization: true },
		});

		return this.finishLogin(user, deviceContext);
	}

	/**
	 * Demande de réinitialisation du mot de passe (mot de passe oublié).
	 * Envoie un email avec un lien contenant un token valide 1h.
	 *
	 * @param email - Email du compte
	 * @throws {NotFoundException} Si l'email n'est pas associé à un compte (message générique pour la confidentialité)
	 */
	async forgotPassword(email: string) {
		const user = await this.prisma.user.findUnique({
			where: { email: email.trim().toLowerCase() },
		});
		if (!user) {
			this.logger.warn(`Forgot password: email not found ${email}`);
			throw new NotFoundException('Si ce compte existe, un email de réinitialisation a été envoyé.');
		}
		if (!user.password) {
			this.logger.warn(`Forgot password: account has no password (Google-only) ${email}`);
			throw new NotFoundException('Si ce compte existe, un email de réinitialisation a été envoyé.');
		}
		const token = crypto.randomBytes(32).toString('hex');
		const expires = new Date(Date.now() + 60 * 60 * 1000);
		await this.prisma.user.update({
			where: { id: user.id },
			data: { passwordResetToken: token, passwordResetExpires: expires },
		});
		const baseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || 'http://localhost:5173';
		const resetUrl = `${baseUrl}/reinitialiser-mot-de-passe/${token}`;
		await this.emailService.sendPasswordReset({
			to: user.email,
			firstName: user.firstName,
			resetUrl,
		});
		this.logger.log(`Forgot password email sent to ${user.email}`);
		return { message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' };
	}

	/**
	 * Réinitialise le mot de passe avec le token reçu par email.
	 *
	 * @param token - Token reçu par email
	 * @param newPassword - Nouveau mot de passe
	 * @throws {BadRequestException} Si le token est invalide ou expiré
	 */
	async resetPassword(token: string, newPassword: string) {
		const user = await this.prisma.user.findFirst({
			where: {
				passwordResetToken: token,
				passwordResetExpires: { gt: new Date() },
			},
		});
		if (!user) {
			throw new BadRequestException('Lien invalide ou expiré. Veuillez refaire une demande de réinitialisation.');
		}
		const hashedPassword = await bcrypt.hash(newPassword, 12);
		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword,
				passwordResetToken: null,
				passwordResetExpires: null,
			},
		});
		this.logger.log(`Password reset success for user ${user.id}`);
		return { message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' };
	}

	/**
	 * Vérifie l'adresse email avec le token reçu par email (inscription).
	 * Active le compte (status ACTIVE, emailVerified true) et efface le token.
	 *
	 * @param token - Token reçu par email
	 * @returns Message de succès
	 * @throws {BadRequestException} Si le token est invalide ou expiré
	 */
	async verifyEmail(token: string) {
		const user = await this.prisma.user.findFirst({
			where: {
				emailVerificationToken: token,
				emailVerificationExpires: { gt: new Date() },
			},
		});
		if (!user) {
			throw new BadRequestException('Lien invalide ou expiré. Vous pouvez demander un nouvel email de confirmation depuis la page de connexion.');
		}
		await this.prisma.user.update({
			where: { id: user.id },
			data: {
				emailVerified: true,
				emailVerifiedAt: new Date(),
				status: 'ACTIVE',
				emailVerificationToken: null,
				emailVerificationExpires: null,
			},
		});
		this.logger.log(`Email verified for user ${user.id}`);
		return { message: 'Adresse email confirmée. Vous pouvez maintenant vous connecter.' };
	}

	/**
	 * Renvoie l'email de vérification pour un compte non encore activé.
	 *
	 * @param email - Email du compte
	 * @throws {NotFoundException} Si l'email n'existe pas ou est déjà vérifié (message générique)
	 */
	async resendVerificationEmail(email: string) {
		const user = await this.prisma.user.findUnique({
			where: { email: email.trim().toLowerCase() },
		});
		if (!user) {
			this.logger.warn(`Resend verification: email not found ${email}`);
			throw new NotFoundException('Si un compte existe avec cet email, un nouvel email de confirmation a été envoyé.');
		}
		if (user.emailVerified) {
			this.logger.warn(`Resend verification: already verified ${email}`);
			throw new NotFoundException('Si un compte existe avec cet email, un nouvel email de confirmation a été envoyé.');
		}
		const token = crypto.randomBytes(32).toString('hex');
		const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
		await this.prisma.user.update({
			where: { id: user.id },
			data: { emailVerificationToken: token, emailVerificationExpires: expires },
		});
		const baseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || 'http://localhost:5173';
		const verifyUrl = `${baseUrl}/verifier-email/${token}`;
		await this.emailService.sendVerifyEmail({
			to: user.email,
			firstName: user.firstName,
			verifyUrl,
		});
		this.logger.log(`Verification email resent to ${user.email}`);
		return { message: 'Si un compte existe avec cet email, un nouvel email de confirmation a été envoyé.' };
	}

	/**
	 * Lie un compte Google à un compte utilisateur existant
	 * 
	 * Permet à un utilisateur ayant créé un compte avec email/mot de passe
	 * de lier son compte Google pour pouvoir se connecter via OAuth.
	 * 
	 * @param userId - ID de l'utilisateur
	 * @param googleUser - Données Google OAuth
	 * @returns Utilisateur mis à jour
	 * @throws {ConflictException} Si le compte Google est déjà lié à un autre utilisateur
	 * 
	 * @example
	 * ```typescript
	 * await authService.linkGoogleAccount(1, {
	 *   googleId: '123456789',
	 *   email: 'user@gmail.com',
	 *   avatar: 'https://...'
	 * });
	 * ```
	 */
	async linkGoogleAccount(userId: number, googleUser: any) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new UnauthorizedException('Utilisateur introuvable');
		}

		// Vérifier si googleId existe déjà
		if (googleUser.googleId) {
			const existing = await this.prisma.user.findUnique({
				where: { googleId: googleUser.googleId },
			});

			if (existing && existing.id !== userId) {
				throw new ConflictException('Ce compte Google est déjà lié à un autre utilisateur');
			}
		}

		return this.prisma.user.update({
			where: { id: userId },
			data: {
				googleId: googleUser.googleId,
				googleEmail: googleUser.email,
				googlePicture: googleUser.avatar,
			},
			include: { organization: true },
		});
	}

	/**
	 * Génère un token JWT pour un utilisateur
	 * 
	 * Le payload contient :
	 * - sub: ID utilisateur
	 * - email: Email utilisateur
	 * - role: Rôle utilisateur
	 * - organizationId: ID de l'organisation
	 * 
	 * @param user - Utilisateur avec organisation
	 * @returns Token JWT et informations utilisateur (sans mot de passe)
	 * 
	 * @private
	 */
	generateTokens(user: any, sessionId: number) {
		const payload = {
			sub: user.id,
			email: user.email,
			role: user.role,
			organizationId: user.organizationId,
			sid: sessionId,
		};

		return {
			access_token: this.jwtService.sign(payload),
			user: {
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
				organization: user.organization,
			},
		};
	}
}

