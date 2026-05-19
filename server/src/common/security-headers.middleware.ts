import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * En-têtes de sécurité HTTP (OWASP baseline) sur toutes les réponses API.
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
	use(_req: Request, res: Response, next: NextFunction): void {
		res.setHeader('X-Content-Type-Options', 'nosniff');
		res.setHeader('X-Frame-Options', 'DENY');
		res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
		res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
		res.setHeader('X-DNS-Prefetch-Control', 'off');
		res.removeHeader('X-Powered-By');
		if (process.env.NODE_ENV === 'prod') {
			res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
		}
		next();
	}
}
