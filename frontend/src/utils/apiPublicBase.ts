/**
 * URL publique de l’API (webhooks Stripe, liens absolus).
 * Aligné sur le serveur : API_PUBLIC_URL → BACKEND_URL → localhost.
 */
export function getApiPublicBase(): string {
	const explicit = import.meta.env.VITE_API_PUBLIC_URL?.trim()
	if (explicit) {
		return explicit.replace(/\/$/, '')
	}
	const fromApi = import.meta.env.VITE_API_URL?.trim()
	if (fromApi && !/your_domain/i.test(fromApi)) {
		return fromApi.replace(/\/api\/?$/i, '').replace(/\/$/, '')
	}
	if (import.meta.env.DEV) {
		return 'http://localhost:3000'
	}
	if (typeof window !== 'undefined') {
		return window.location.origin.replace(/\/$/, '')
	}
	return 'http://localhost:3000'
}

/** Webhook unique : abonnement PrestaFacture + paiements factures clients. */
export function buildInvoiceStripeWebhookUrl(_organizationId?: number): string {
	return `${getApiPublicBase()}/api/webhooks/stripe`
}
