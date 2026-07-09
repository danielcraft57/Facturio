import { ForbiddenException } from '@nestjs/common';
import type { EmailOrganizationProfile } from '../common/email.service';
import { DEMO_ORG_NAME, DEMO_USER_EMAIL } from './demo.constants';

/** Utilisateur authentifié potentiellement en mode démo. */
export type DemoAwareUser = {
	email?: string;
	isDemo?: boolean;
	organization?: { name?: string } | null;
} | null | undefined;

/**
 * Indique si le profil organisation correspond à l'espace démo.
 *
 * @param organization - Profil org ou objet avec un champ name
 */
export function isDemoOrganization(
	organization?: { name?: string } | EmailOrganizationProfile | null,
): boolean {
	const name =
		organization && typeof organization === 'object' && 'name' in organization
			? String((organization as { name?: string }).name ?? '').trim()
			: '';
	return name === DEMO_ORG_NAME;
}

/**
 * Détecte une session démo (flag JWT, email dédié ou nom d'organisation).
 *
 * @param user - Utilisateur issu de JwtStrategy
 */
export function isDemoUser(user: DemoAwareUser): boolean {
	if (!user) return false;
	if (user.isDemo === true) return true;
	if (user.email?.toLowerCase() === DEMO_USER_EMAIL) return true;
	return isDemoOrganization(user.organization);
}

/**
 * Bloque toute mutation API pour le compte démo partagé.
 *
 * @param user - Utilisateur courant
 * @throws {ForbiddenException} Si l'utilisateur est en mode démo
 */
export function assertDemoReadOnly(user: DemoAwareUser): void {
	if (!isDemoUser(user)) return;
	throw new ForbiddenException({
		message:
			'Cette action est désactivée en mode démo. Créez un compte gratuit pour modifier vos données.',
		code: 'DEMO_READ_ONLY',
	});
}

/**
 * Bloque l'envoi d'emails métier depuis l'organisation démo.
 *
 * @param organization - Profil émetteur
 * @throws {ForbiddenException} Si l'organisation est démo
 */
export function assertDemoOutboundEmailBlocked(
	organization?: EmailOrganizationProfile | { name?: string } | null,
): void {
	if (!isDemoOrganization(organization)) return;
	throw new ForbiddenException({
		message: 'L\'envoi d\'emails est désactivé en mode démo.',
		code: 'DEMO_EMAIL_BLOCKED',
	});
}

/** Méthodes HTTP considérées comme lecture seule. */
export function isHttpReadMethod(method: string): boolean {
	return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

/**
 * Chemins POST autorisés en démo (prévisualisations, session).
 *
 * @param path - Chemin API normalisé (/api/...)
 */
export function isDemoMutationAllowedPath(path: string): boolean {
	const allowedPrefixes = [
		'/api/auth/logout',
		'/api/auth/session/bootstrap',
		'/api/demo/',
	];
	if (allowedPrefixes.some((p) => path === p.replace(/\/$/, '') || path.startsWith(p))) {
		return true;
	}
	if (/^\/api\/invoices\/[^/]+\/installments\/preview-equal$/.test(path)) return true;
	if (/^\/api\/factures\/[^/]+\/installments\/preview-equal$/.test(path)) return true;
	if (path === '/api/onboarding/preview') return true;
	return false;
}
