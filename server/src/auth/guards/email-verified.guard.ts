import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

/** Routes API accessibles sans email vérifié (onboarding post-inscription). */
const EMAIL_VERIFICATION_OPTIONAL_PREFIXES = [
	'/api/onboarding',
	'/api/auth/me',
	'/api/auth/logout',
	'/api/auth/session/bootstrap',
	'/api/auth/resend-verification',
];

/**
 * Bloque l'accès métier tant que l'email n'est pas confirmé (après connexion).
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const path = (request.path || request.url || '').split('?')[0];

		if (EMAIL_VERIFICATION_OPTIONAL_PREFIXES.some((p) => path.startsWith(p))) {
			return true;
		}

		const user = request.user;
		if (!user || user.emailVerified) {
			return true;
		}

		throw new ForbiddenException({
			message:
				'Confirmez votre adresse email pour accéder à cette fonctionnalité. Consultez votre boîte de réception.',
			code: 'EMAIL_NOT_VERIFIED',
		});
	}
}
