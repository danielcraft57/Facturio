/** Moyens de paiement Stripe autorisés pour les factures clients (PaymentIntent). */
export const INVOICE_STRIPE_PAYMENT_METHOD_IDS = [
	'card',
	'paypal',
	'bancontact',
	'klarna',
	'amazon_pay',
	'eps',
	'mb_way',
	'ideal',
	'link',
] as const;

export type InvoiceStripePaymentMethodId = (typeof INVOICE_STRIPE_PAYMENT_METHOD_IDS)[number];

export const INVOICE_STRIPE_PAYMENT_METHOD_LABELS: Record<InvoiceStripePaymentMethodId, string> = {
	card: 'Carte bancaire (Visa, Mastercard…)',
	paypal: 'PayPal',
	bancontact: 'Bancontact',
	klarna: 'Klarna',
	amazon_pay: 'Amazon Pay',
	eps: 'EPS',
	mb_way: 'MB WAY',
	ideal: 'iDEAL',
	link: 'Link',
};

const ALLOWED = new Set<string>(INVOICE_STRIPE_PAYMENT_METHOD_IDS);

export const DEFAULT_INVOICE_STRIPE_PAYMENT_METHODS: InvoiceStripePaymentMethodId[] = ['card'];

export function normalizeInvoiceStripePaymentMethods(
	input: string[] | null | undefined,
): InvoiceStripePaymentMethodId[] {
	if (!input?.length) return [...DEFAULT_INVOICE_STRIPE_PAYMENT_METHODS];
	const out: InvoiceStripePaymentMethodId[] = [];
	for (const id of input) {
		const key = String(id).trim().toLowerCase();
		if (ALLOWED.has(key) && !out.includes(key as InvoiceStripePaymentMethodId)) {
			out.push(key as InvoiceStripePaymentMethodId);
		}
	}
	return out.length > 0 ? out : [...DEFAULT_INVOICE_STRIPE_PAYMENT_METHODS];
}

export function parseInvoiceStripePaymentMethodsStored(
	raw: string | null | undefined,
): InvoiceStripePaymentMethodId[] {
	if (!raw?.trim()) return [...DEFAULT_INVOICE_STRIPE_PAYMENT_METHODS];
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (Array.isArray(parsed)) {
			return normalizeInvoiceStripePaymentMethods(parsed as string[]);
		}
	} catch {
		return normalizeInvoiceStripePaymentMethods(raw.split(',').map((s) => s.trim()));
	}
	return [...DEFAULT_INVOICE_STRIPE_PAYMENT_METHODS];
}

export function serializeInvoiceStripePaymentMethods(
	methods: InvoiceStripePaymentMethodId[],
): string {
	return JSON.stringify(normalizeInvoiceStripePaymentMethods(methods));
}
