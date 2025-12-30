import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

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
	) {}

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
		// Vérifier si l'email existe déjà
		const existingUser = await this.prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existingUser) {
			throw new ConflictException('Cet email est déjà utilisé');
		}

		// Hasher le mot de passe
		const hashedPassword = await bcrypt.hash(data.password, 12);

		// Créer l'organisation
		const organization = await this.prisma.organization.create({
			data: {
				name: data.organizationName,
				companyType: 'B2B',
			},
		});

		// Créer l'utilisateur
		const user = await this.prisma.user.create({
			data: {
				email: data.email,
				password: hashedPassword,
				firstName: data.firstName,
				lastName: data.lastName,
				organizationId: organization.id,
				status: 'ACTIVE', // En production, mettre PENDING et envoyer email de vérification
				emailVerified: true, // En production, mettre false
				emailVerifiedAt: new Date(),
				role: 'ADMIN', // Premier utilisateur = admin
			},
			include: { organization: true },
		});

		return this.generateTokens(user);
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
	async login(data: LoginDto) {
		const user = await this.prisma.user.findUnique({
			where: { email: data.email },
			include: { organization: true },
		});

		if (!user) {
			throw new UnauthorizedException('Email ou mot de passe incorrect');
		}

		if (!user.password) {
			throw new UnauthorizedException('Veuillez vous connecter avec Google');
		}

		const isPasswordValid = await bcrypt.compare(data.password, user.password);

		if (!isPasswordValid) {
			throw new UnauthorizedException('Email ou mot de passe incorrect');
		}

		if (user.status !== 'ACTIVE') {
			throw new UnauthorizedException('Compte non actif');
		}

		// Mettre à jour dernière connexion
		await this.prisma.user.update({
			where: { id: user.id },
			data: { lastLoginAt: new Date() },
		});

		return this.generateTokens(user);
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
	async validateGoogleUser(googleUser: any) {
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
			return this.generateTokens(user);
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
			return this.generateTokens(user);
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

		return this.generateTokens(user);
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
	private generateTokens(user: any) {
		const payload = {
			sub: user.id,
			email: user.email,
			role: user.role,
			organizationId: user.organizationId,
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

