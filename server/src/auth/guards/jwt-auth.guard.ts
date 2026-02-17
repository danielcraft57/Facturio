import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Chemins API qui ne requièrent pas de JWT (login, signup, routes publiques). */
const PUBLIC_PATHS = [
	'/api/auth/login',
	'/api/auth/signup',
	'/api/auth/logout',
	'/api/auth/google',
	'/api/public',
	'/api/track',
];

/**
 * Guard JWT global : en prod (ALLOW_PUBLIC_ACCESS) valide le token et attache l'utilisateur.
 * En local, si LocalOnlyGuard a déjà attaché request.user, on laisse passer sans exiger de JWT.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		if (request.user) return true;
		const path = (request.path || request.url || '').split('?')[0];
		if (PUBLIC_PATHS.some((p) => path.startsWith(p))) return true;
		return super.canActivate(context);
	}
}

