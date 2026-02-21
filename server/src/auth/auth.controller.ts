import { Body, Controller, Get, Post, Query, Req, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RateLimitService } from '../common/rate-limit.middleware';

/**
 * Controller d'authentification
 * 
 * Gère les endpoints d'authentification :
 * - POST /auth/signup : Inscription
 * - POST /auth/login : Connexion
 * - POST /auth/logout : Déconnexion
 * - GET /auth/google : Démarrage OAuth Google
 * - GET /auth/google/callback : Callback OAuth Google
 * - POST /auth/google/link : Lier compte Google
 * - GET /auth/me : Profil utilisateur actuel
 * 
 * Les tokens JWT sont gérés via cookies HTTP-only pour la sécurité.
 * 
 * @see AuthService pour la logique métier
 */
@Controller('auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly rateLimitService: RateLimitService,
	) {}

	/**
	 * Inscription d'un nouvel utilisateur
	 * 
	 * Crée un compte utilisateur et une organisation, puis définit un cookie de session.
	 * 
	 * @param data - Données d'inscription
	 * @param res - Response Express pour définir le cookie
	 * @returns Token JWT et informations utilisateur
	 */
	@Post('signup')
	async signup(@Body() data: SignupDto, @Res({ passthrough: true }) res: Response) {
		const result = await this.authService.signup(data);
		if ((result as any).needVerification) {
			return result;
		}
		this.setAuthCookie(res, (result as any).access_token);
		return result;
	}

	/**
	 * Connexion d'un utilisateur
	 * 
	 * Vérifie les identifiants et définit un cookie de session.
	 * 
	 * @param data - Données de connexion (email, password)
	 * @param res - Response Express pour définir le cookie
	 * @returns Token JWT et informations utilisateur
	 */
	@Post('login')
	async login(@Body() data: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
		const result = await this.authService.login(data);
		// Réinitialiser le rate limit après connexion réussie
		const ip = this.rateLimitService.getClientIp(req);
		this.rateLimitService.resetLimit(ip, this.rateLimitService.loginAttempts);
		// Définir le cookie avec le token
		this.setAuthCookie(res, result.access_token);
		return result;
	}

	/**
	 * Déconnexion d'un utilisateur
	 *
	 * Supprime le cookie de session. Appelé par le frontend pour invalider la session côté serveur.
	 *
	 * @param res - Response Express pour supprimer le cookie
	 * @returns Message de confirmation
	 */
	@Post('logout')
	async logout(@Res({ passthrough: true }) res: Response) {
		res.clearCookie('access_token', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
		});
		return { message: 'Déconnexion réussie' };
	}

	/**
	 * Demande de réinitialisation du mot de passe (mot de passe oublié).
	 * Envoie un email avec un lien de réinitialisation (valide 1h).
	 */
	@Post('forgot-password')
	async forgotPassword(@Body() body: { email: string }) {
		if (!body?.email?.trim()) {
			throw new BadRequestException('Email requis');
		}
		return this.authService.forgotPassword(body.email.trim());
	}

	/**
	 * Réinitialise le mot de passe avec le token reçu par email.
	 */
	@Post('reset-password')
	async resetPassword(@Body() body: { token: string; newPassword: string }) {
		if (!body?.token?.trim() || !body?.newPassword) {
			throw new BadRequestException('Token et nouveau mot de passe requis');
		}
		return this.authService.resetPassword(body.token.trim(), body.newPassword);
	}

	/**
	 * Vérifie l'adresse email avec le token reçu par email (lien dans l'email d'inscription).
	 * Accepte GET ?token=xxx (lien cliqué dans l'email) ou POST { token }.
	 */
	@Get('verify-email')
	async verifyEmailGet(@Query('token') token: string) {
		if (!token?.trim()) {
			throw new BadRequestException('Token requis');
		}
		return this.authService.verifyEmail(token.trim());
	}

	@Post('verify-email')
	async verifyEmailPost(@Body() body: { token: string }) {
		if (!body?.token?.trim()) {
			throw new BadRequestException('Token requis');
		}
		return this.authService.verifyEmail(body.token.trim());
	}

	/**
	 * Renvoie l'email de vérification pour un compte non encore activé.
	 */
	@Post('resend-verification')
	async resendVerification(@Body() body: { email: string }) {
		if (!body?.email?.trim()) {
			throw new BadRequestException('Email requis');
		}
		return this.authService.resendVerificationEmail(body.email.trim());
	}

	/**
	 * Définit le cookie d'authentification
	 * 
	 * Cookie HTTP-only pour la sécurité (pas accessible via JavaScript).
	 * Durée de vie : 7 jours.
	 * 
	 * @param res - Response Express
	 * @param token - Token JWT à stocker
	 * @private
	 */
	private setAuthCookie(res: Response, token: string) {
		const isProduction = process.env.NODE_ENV === 'production';
		const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 jours

		res.cookie('access_token', token, {
			httpOnly: true, // Empêche l'accès JavaScript côté client
			secure: isProduction, // HTTPS uniquement en production
			sameSite: 'lax', // Protection CSRF
			maxAge: maxAge,
			path: '/',
		});
	}

	/**
	 * Démarre l'authentification Google OAuth
	 * 
	 * Redirige vers la page de connexion Google.
	 * 
	 * @returns Redirection vers Google
	 */
	@Get('google')
	@UseGuards(GoogleAuthGuard)
	googleAuth() {
		// Redirige vers Google
	}

	/**
	 * Callback OAuth Google
	 * 
	 * Appelé par Google après authentification.
	 * Crée ou connecte l'utilisateur, puis redirige vers le frontend.
	 * 
	 * @param req - Request Express avec les données Google
	 * @param res - Response Express pour redirection
	 * @returns Redirection vers le frontend avec token
	 */
	@Get('google/callback')
	@UseGuards(GoogleAuthGuard)
	async googleCallback(@Req() req: Request, @Res() res: Response) {
		const result = await this.authService.validateGoogleUser(req.user as any);
		// Définir le cookie avec le token
		this.setAuthCookie(res, result.access_token);
		const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
		res.redirect(`${frontendUrl}/auth/callback`);
	}

	/**
	 * Lie un compte Google à un compte existant
	 * 
	 * Permet à un utilisateur connecté de lier son compte Google.
	 * Nécessite une authentification.
	 * 
	 * @param user - Utilisateur actuel (injecté via CurrentUser)
	 * @param body - Token Google (à vérifier en production)
	 * @returns Utilisateur mis à jour
	 */
	@Post('google/link')
	async linkGoogle(@CurrentUser() user: any, @Body() body: { googleToken: string }) {
		// En production, vérifier le token Google côté serveur
		// Pour l'instant, on accepte les données directement
		return this.authService.linkGoogleAccount(user.id, body as any);
	}

	/**
	 * Récupère le profil de l'utilisateur actuel
	 * 
	 * Nécessite une authentification.
	 * 
	 * @param user - Utilisateur actuel (injecté via CurrentUser)
	 * @returns Informations utilisateur (sans données sensibles)
	 */
	@Get('me')
	async getProfile(@CurrentUser() user: any) {
		return {
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
			organization: user.organization,
		};
	}
}

