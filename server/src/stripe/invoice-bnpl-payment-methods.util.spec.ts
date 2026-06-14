import {
	assertBnplMethodsRegistered,
	filterBnplPaymentMethodsForAmount,
	resolveActiveBnplPaymentMethods,
} from './invoice-bnpl-payment-methods.util';

describe('invoice-bnpl-payment-methods.util', () => {
	it('enregistre klarna et alma dans la liste globale', () => {
		expect(() => assertBnplMethodsRegistered()).not.toThrow();
	});

	it('filtre klarna au-delà de 1 500 € mais garde alma jusqu’à 5 000 €', () => {
		expect(
			filterBnplPaymentMethodsForAmount(['card', 'paypal', 'klarna', 'alma'], 2_000, 'eur'),
		).toEqual(['card', 'paypal', 'alma']);
	});

	it('propose klarna entre 1 et 1 500 €', () => {
		expect(filterBnplPaymentMethodsForAmount(['klarna'], 500, 'eur')).toEqual(['klarna']);
		expect(filterBnplPaymentMethodsForAmount(['klarna'], 1_501, 'eur')).toEqual([]);
	});

	it('propose alma entre 50 et 5 000 €', () => {
		expect(filterBnplPaymentMethodsForAmount(['alma'], 49.99, 'eur')).toEqual([]);
		expect(filterBnplPaymentMethodsForAmount(['alma'], 50, 'eur')).toEqual(['alma']);
		expect(filterBnplPaymentMethodsForAmount(['alma'], 5_000, 'eur')).toEqual(['alma']);
		expect(filterBnplPaymentMethodsForAmount(['alma'], 5_001, 'eur')).toEqual([]);
	});

	it('exclut BNPL hors EUR', () => {
		expect(filterBnplPaymentMethodsForAmount(['klarna', 'card'], 100, 'usd')).toEqual(['card']);
	});

	it('resolveActiveBnplPaymentMethods ne retourne que les BNPL éligibles', () => {
		expect(
			resolveActiveBnplPaymentMethods(['card', 'klarna', 'alma'], 800, 'eur'),
		).toEqual(['klarna', 'alma']);
		expect(resolveActiveBnplPaymentMethods(['klarna', 'alma'], 40, 'eur')).toEqual(['klarna']);
	});
});
