import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RateLimitService } from './rate-limit.middleware';

/**
 * Limite les accès aux routes publiques (factures/devis par token).
 * 60 requêtes / IP / 15 min par défaut.
 */
@Injectable()
export class PublicAccessRateLimitMiddleware implements NestMiddleware {
	private readonly attempts = new Map<string, { count: number; resetAt: number }>();
	private readonly maxAttempts = 60;
	private readonly windowMs = 15 * 60 * 1000;

	constructor(private readonly rateLimit: RateLimitService) {}

	use(req: Request, res: Response, next: NextFunction): void {
		const ip = this.rateLimit.getClientIp(req);
		const ok = this.rateLimit.checkLimit(ip, this.attempts, this.maxAttempts, this.windowMs);
		if (!ok) {
			throw new HttpException('Trop de requêtes. Réessayez plus tard.', HttpStatus.TOO_MANY_REQUESTS);
		}
		next();
	}
}
