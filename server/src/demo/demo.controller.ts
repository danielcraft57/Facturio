import { Body, Controller, Get, Post, Req, Res, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response } from 'express';
import { DemoService } from './demo.service';
import { RateLimitService } from '../common/rate-limit.middleware';

/**
 * Endpoints publics de l'espace démo Facturio.
 * Permet à tout visiteur d'explorer l'application sans créer de compte.
 */
@Controller('demo')
export class DemoController {
	constructor(
		private readonly demoService: DemoService,
		private readonly rateLimitService: RateLimitService,
	) {}

	/**
	 * État de la démo : disponibilité et volumes de données.
	 *
	 * @returns Informations publiques sur l'espace démo
	 */
	@Get('info')
	getInfo() {
		return this.demoService.getInfo();
	}

	/**
	 * Initialise les données démo si nécessaire (idempotent).
	 * Utile en dev ou après un déploiement sans seed manuel.
	 */
	@Post('ensure')
	ensure() {
		return this.demoService.ensureDemoData().then(() => this.demoService.getInfo());
	}

	/**
	 * Connexion instantanée sur le compte démo partagé.
	 * Dépose le cookie de session comme un login classique.
	 *
	 * @param body - Empreinte appareil optionnelle
	 * @param req - Requête HTTP (IP, user-agent)
	 * @param res - Réponse pour le cookie JWT
	 */
	@Post('enter')
	async enter(
		@Body() body: { deviceFingerprint?: string },
		@Req() req: Request,
		@Res({ passthrough: true }) res: Response,
	) {
		const deviceContext = {
			ip: this.rateLimitService.getClientIp(req),
			userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : undefined,
			deviceFingerprint: body?.deviceFingerprint,
		};

		const result = await this.demoService.enterDemo(deviceContext);

		if (!('access_token' in result) || !result.access_token) {
			throw new ServiceUnavailableException('La démo n\'a pas pu démarrer.');
		}

		this.setAuthCookie(res, result.access_token);
		return result;
	}

	/**
	 * Définit le cookie d'authentification (même politique que AuthController).
	 *
	 * @param res - Réponse Express
	 * @param token - JWT à stocker
	 */
	private setAuthCookie(res: Response, token: string) {
		const isProduction = process.env.NODE_ENV === 'production';

		res.cookie('access_token', token, {
			httpOnly: true,
			secure: isProduction,
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60 * 1000,
			path: '/',
		});
	}
}
