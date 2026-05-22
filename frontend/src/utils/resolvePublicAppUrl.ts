const PLACEHOLDER_PUBLIC_URL = /your_domain/i

/** URL publique de l’app (liens partagés, redirects). Dérivée du navigateur si non configurée. */
export function resolvePublicAppUrl(): string {
	const raw = import.meta.env.VITE_PUBLIC_APP_URL?.trim()
	if (raw && !PLACEHOLDER_PUBLIC_URL.test(raw)) {
		return raw.replace(/\/$/, '')
	}
	if (typeof window !== 'undefined' && window.location?.origin) {
		return window.location.origin
	}
	return ''
}
