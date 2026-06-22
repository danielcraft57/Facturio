/** Types d’événements Stripe plateforme (abonnement PrestaFacture). */
export const PLATFORM_STRIPE_EVENT_TYPES = new Set([
	'checkout.session.completed',
	'customer.subscription.updated',
	'customer.subscription.deleted',
	'invoice.payment_failed',
	'invoice.paid',
]);

export function isPlatformBillingEventType(type: string): boolean {
	return PLATFORM_STRIPE_EVENT_TYPES.has(type);
}

/** Lecture non vérifiée du corps — sert uniquement à choisir le secret de signature. */
export function peekWebhookPayload(rawBody: Buffer): {
	type?: string;
	organizationId?: number;
	invoiceId?: number;
} {
	try {
		const parsed = JSON.parse(rawBody.toString('utf8')) as {
			type?: string;
			data?: { object?: { metadata?: Record<string, string> } };
		};
		const meta = parsed?.data?.object?.metadata;
		const organizationId = meta?.organizationId ? Number(meta.organizationId) : undefined;
		const invoiceId = meta?.invoiceId ? Number(meta.invoiceId) : undefined;
		return {
			type: parsed?.type,
			organizationId: organizationId && !Number.isNaN(organizationId) ? organizationId : undefined,
			invoiceId: invoiceId && !Number.isNaN(invoiceId) ? invoiceId : undefined,
		};
	} catch {
		return {};
	}
}

export function buildUnifiedStripeWebhookUrl(): string {
	const base =
		process.env.API_PUBLIC_URL?.trim() ||
		process.env.BACKEND_URL?.trim() ||
		'http://localhost:3000';
	return `${base.replace(/\/$/, '')}/api/webhooks/stripe`;
}
