import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Chemins publics (égalité stricte — évite que /api/catalog/packs/xxx soit public). */
const PUBLIC_EXACT_PATHS = new Set([
	'/api/auth/login',
	'/api/auth/signup',
	'/api/auth/logout',
	'/api/auth/forgot-password',
	'/api/auth/reset-password',
	'/api/auth/verify-email',
	'/api/auth/resend-verification',
	'/api/auth/verify-device',
	'/api/auth/google',
	'/api/auth/google/callback',
	'/api/catalog/tech-choices',
	'/api/catalog/packs',
	'/api/e-invoicing/reform-schedule',
	'/api/billing/beta-invite/validate',
	'/api/billing/beta-program/stats',
]);

/** Préfixes pour arbres entiers (devis publics, webhooks, etc.). */
const PUBLIC_PREFIX_PATHS = ['/api/public', '/api/track', '/api/webhooks'];

function isPublicPath(path: string): boolean {
	if (PUBLIC_EXACT_PATHS.has(path)) return true;
	return PUBLIC_PREFIX_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Guard JWT global : exige un token JWT valide pour toutes les routes sauf les chemins publics.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		const path = (request.path || request.url || '').split('?')[0];
		if (isPublicPath(path)) return true;
		return super.canActivate(context);
	}
}

