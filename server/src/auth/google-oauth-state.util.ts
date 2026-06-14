import * as crypto from 'crypto';

/** Contexte porté dans le paramètre OAuth `state` (inscription Google + code beta). */
export interface GoogleOAuthSignupState {
	intent?: 'signup' | 'login';
	betaInviteCode?: string;
	acceptTerms?: boolean;
	acceptPrivacy?: boolean;
	/** Empreinte navigateur (évite unknown-device côté callback). */
	deviceFingerprint?: string;
}

const STATE_TTL_MS = 15 * 60 * 1000;

function stateSecret(): string {
	return process.env.JWT_SECRET || 'facturio-google-oauth-state-dev';
}

/**
 * Sérialise et signe le contexte OAuth Google (HMAC).
 *
 * @param payload - Données à conserver pendant la redirection Google
 * @returns Token base64url
 */
export function encodeGoogleOAuthState(payload: GoogleOAuthSignupState): string {
	const body = {
		...payload,
		exp: Date.now() + STATE_TTL_MS,
	};
	const json = JSON.stringify(body);
	const sig = crypto.createHmac('sha256', stateSecret()).update(json).digest('base64url');
	return Buffer.from(JSON.stringify({ json, sig }), 'utf8').toString('base64url');
}

/**
 * Décode et vérifie le paramètre `state` renvoyé par Google.
 *
 * @param raw - Valeur brute du query param `state`
 * @returns Contexte ou null si invalide / expiré
 */
export function decodeGoogleOAuthState(raw?: string | null): GoogleOAuthSignupState | null {
	if (!raw?.trim()) return null;
	try {
		const wrapper = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
			json?: string;
			sig?: string;
		};
		if (!wrapper.json || !wrapper.sig) return null;
		const expected = crypto
			.createHmac('sha256', stateSecret())
			.update(wrapper.json)
			.digest('base64url');
		if (expected !== wrapper.sig) return null;
		const parsed = JSON.parse(wrapper.json) as GoogleOAuthSignupState & { exp?: number };
		if (!parsed.exp || parsed.exp < Date.now()) return null;
		return {
			intent: parsed.intent,
			betaInviteCode: parsed.betaInviteCode?.trim()?.toUpperCase() || undefined,
			acceptTerms: Boolean(parsed.acceptTerms),
			acceptPrivacy: Boolean(parsed.acceptPrivacy),
			deviceFingerprint: parsed.deviceFingerprint?.trim()?.slice(0, 128) || undefined,
		};
	} catch {
		return null;
	}
}

/**
 * Construit le state OAuth à partir des query params de départ (/auth/google).
 *
 * @param query - Query string Express
 */
export function googleOAuthStateFromQuery(query: Record<string, unknown>): GoogleOAuthSignupState {
	const intent = query.intent === 'signup' ? 'signup' : query.intent === 'login' ? 'login' : undefined;
	const betaRaw = typeof query.beta === 'string' ? query.beta : typeof query.code === 'string' ? query.code : '';
	const betaInviteCode = betaRaw.trim().toUpperCase() || undefined;
	const fpRaw = typeof query.deviceFingerprint === 'string' ? query.deviceFingerprint : '';
	const deviceFingerprint = fpRaw.trim().slice(0, 128) || undefined;
	return {
		intent,
		betaInviteCode,
		acceptTerms: query.acceptTerms === '1' || query.acceptTerms === 'true',
		acceptPrivacy: query.acceptPrivacy === '1' || query.acceptPrivacy === 'true',
		deviceFingerprint,
	};
}
