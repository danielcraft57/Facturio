import { parseInvoiceStripePaymentMethodsStored } from '../stripe/invoice-stripe-payment-methods';

/** Masque les secrets Stripe prestataire dans les réponses API. */
export function sanitizeOrganizationProfile<T extends Record<string, unknown>>(org: T) {
	const {
		invoiceStripeSecretKey,
		invoiceStripeWebhookSecret,
		invoiceStripePaymentMethods,
		prospectLabApiKey,
		...safe
	} = org as T & {
		invoiceStripeSecretKey?: string | null;
		invoiceStripeWebhookSecret?: string | null;
		invoiceStripePaymentMethods?: string | null;
		prospectLabApiKey?: string | null;
	};

	return {
		...safe,
		prospectLabApiKeySet: !!prospectLabApiKey,
		invoiceStripeSecretKeySet: !!invoiceStripeSecretKey,
		invoiceStripeWebhookSecretSet: !!invoiceStripeWebhookSecret,
		invoiceStripePaymentMethods: parseInvoiceStripePaymentMethodsStored(invoiceStripePaymentMethods),
		invoiceStripePublishableKeyPreview: maskPublishableKey(
			safe.invoiceStripePublishableKey as string | undefined,
		),
	};
}

function maskPublishableKey(pk?: string | null): string | null {
	if (!pk) return null;
	if (pk.length < 12) return '••••';
	return `${pk.slice(0, 12)}…${pk.slice(-4)}`;
}
