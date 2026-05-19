import {
	normalizeInvoiceStripePaymentMethods,
	parseInvoiceStripePaymentMethodsStored,
} from './invoice-stripe-payment-methods';

describe('invoice-stripe-payment-methods', () => {
	it('défaut carte seule', () => {
		expect(parseInvoiceStripePaymentMethodsStored(null)).toEqual(['card']);
	});

	it('ignore les ids invalides', () => {
		expect(normalizeInvoiceStripePaymentMethods(['card', 'bitcoin', 'paypal'])).toEqual([
			'card',
			'paypal',
		]);
	});

	it('parse le JSON stocké', () => {
		expect(parseInvoiceStripePaymentMethodsStored('["card","bancontact"]')).toEqual([
			'card',
			'bancontact',
		]);
	});
});
