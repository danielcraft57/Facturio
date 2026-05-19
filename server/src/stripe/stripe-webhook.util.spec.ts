import {
	buildUnifiedStripeWebhookUrl,
	isPlatformBillingEventType,
	peekWebhookPayload,
} from './stripe-webhook.util';

describe('stripe-webhook.util', () => {
	it('détecte les événements plateforme', () => {
		expect(isPlatformBillingEventType('checkout.session.completed')).toBe(true);
		expect(isPlatformBillingEventType('payment_intent.succeeded')).toBe(false);
	});

	it('lit organizationId et invoiceId dans le corps', () => {
		const body = Buffer.from(
			JSON.stringify({
				type: 'payment_intent.succeeded',
				data: {
					object: {
						metadata: { organizationId: '42', invoiceId: '99' },
					},
				},
			}),
		);
		expect(peekWebhookPayload(body)).toEqual({
			type: 'payment_intent.succeeded',
			organizationId: 42,
			invoiceId: 99,
		});
	});

	it('construit l’URL webhook unifiée', () => {
		process.env.API_PUBLIC_URL = 'https://facturio.test';
		expect(buildUnifiedStripeWebhookUrl()).toBe('https://facturio.test/api/webhooks/stripe');
	});
});
