const PLACEHOLDER_API_URL = /your_domain/i

/**
 * URL de base de l’API (ex. `/api` ou `https://facturio.example.com/api`).
 * Ignore les placeholders du template env.prod.example.
 */
export function resolveApiBaseUrl(): string {
	const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'
	if (isDev) {
		return '/api'
	}

	const raw = import.meta.env.VITE_API_URL?.trim()
	if (raw && !PLACEHOLDER_API_URL.test(raw)) {
		return raw.replace(/\/$/, '')
	}

	return '/api'
}
