import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private jwtService: JwtService,
	) {}

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

