import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Service de rate limiting partagé pour être utilisé dans les middlewares et services.
 */
@Injectable()
export class RateLimitService {
	readonly loginAttempts = new Map<string, { count: number; resetAt: number }>();
	readonly signupAttempts = new Map<string, { count: number; resetAt: number }>();
	readonly passwordResetAttempts = new Map<string, { count: number; resetAt: number }>();

	getClientIp(req: Request): string {
		return (
			(req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
			(req.headers['x-real-ip'] as string) ||
			req.socket.remoteAddress ||
			'unknown'
		);
	}

	checkLimit(
		key: string,
		map: Map<string, { count: number; resetAt: number }>,
		maxAttempts: number,
		windowMs: number
	): boolean {
		const now = Date.now();
		const record = map.get(key);

		if (!record || now > record.resetAt) {
			map.set(key, { count: 1, resetAt: now + windowMs });
			return true;
		}

		if (record.count >= maxAttempts) {
			return false;
		}

		record.count++;
		return true;
	}

	resetLimit(key: string, map: Map<string, { count: number; resetAt: number }>) {
		map.delete(key);
	}
}

/**
 * Rate limiting simple en mémoire pour protéger contre les attaques par force brute.
 * 
 * Limite :
 * - Login : 5 tentatives par IP par 15 minutes
 * - Signup : 3 tentatives par IP par heure
 * - Password reset : 3 tentatives par email par heure
 * 
 * En production, utiliser Redis pour un rate limiting distribué.
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
	constructor(private readonly rateLimitService: RateLimitService) {}

	use(req: Request, res: Response, next: NextFunction) {
		const ip = this.rateLimitService.getClientIp(req);
		const path = req.path;

		// Rate limiting pour login
		if (path === '/api/auth/login' && req.method === 'POST') {
			if (!this.rateLimitService.checkLimit(ip, this.rateLimitService.loginAttempts, 5, 15 * 60 * 1000)) {
				throw new HttpException(
					'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
					HttpStatus.TOO_MANY_REQUESTS
				);
			}
		}

		// Rate limiting pour signup
		if (path === '/api/auth/signup' && req.method === 'POST') {
			if (!this.rateLimitService.checkLimit(ip, this.rateLimitService.signupAttempts, 3, 60 * 60 * 1000)) {
				throw new HttpException(
					'Trop de tentatives d\'inscription. Veuillez réessayer dans 1 heure.',
					HttpStatus.TOO_MANY_REQUESTS
				);
			}
		}

		// Rate limiting pour password reset (par email)
		if (path === '/api/auth/forgot-password' && req.method === 'POST') {
			const email = req.body?.email?.toLowerCase()?.trim();
			if (email) {
				if (!this.rateLimitService.checkLimit(email, this.rateLimitService.passwordResetAttempts, 3, 60 * 60 * 1000)) {
					throw new HttpException(
						'Trop de demandes de réinitialisation. Veuillez réessayer dans 1 heure.',
						HttpStatus.TOO_MANY_REQUESTS
					);
				}
			}
		}

		next();
	}
}
