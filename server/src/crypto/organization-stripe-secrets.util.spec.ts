import { encryptOrgStripeFields } from './organization-stripe-secrets.util';

describe('encryptOrgStripeFields', () => {
	const crypto = {
		encrypt: (v: string) => `enc:${v}`,
	};

	it('ignore les chaînes vides (ne pas effacer un secret existant)', () => {
		const out = encryptOrgStripeFields(crypto as never, {
			invoiceStripeSecretKey: '',
			invoiceStripeWebhookSecret: '   ',
		});
		expect(out).toEqual({});
	});

	it('chiffre une nouvelle valeur non vide', () => {
		const out = encryptOrgStripeFields(crypto as never, {
			invoiceStripeSecretKey: 'sk_test_abc',
		});
		expect(out.invoiceStripeSecretKey).toBe('enc:sk_test_abc');
	});

	it('efface avec les flags explicites', () => {
		const out = encryptOrgStripeFields(crypto as never, {
			clearInvoiceStripeSecretKey: true,
			clearInvoiceStripeWebhookSecret: true,
		});
		expect(out.invoiceStripeSecretKey).toBeNull();
		expect(out.invoiceStripeWebhookSecret).toBeNull();
	});
});
