import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Chemins API qui ne requièrent pas de JWT (auth, routes publiques, tracking). */
const PUBLIC_PATHS = [
	'/api/auth/login',
	'/api/auth/signup',
	'/api/auth/logout',
	'/api/auth/forgot-password',
	'/api/auth/reset-password',
	'/api/auth/verify-email',
	'/api/auth/resend-verification',
	'/api/auth/google',
	'/api/public',
	'/api/track',
];

/**
 * Guard JWT global : exige un token JWT valide pour toutes les routes sauf les chemins publics.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		const path = (request.path || request.url || '').split('?')[0];
		if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return true;
		return super.canActivate(context);
	}
}

