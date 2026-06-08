import { isValidProductSku, normalizeProductSku } from './product-sku.util';

describe('product-sku', () => {
	it('normalise en majuscules avec tirets', () => {
		expect(normalizeProductSku('  stack-wp-vitrine ')).toBe('STACK-WP-VITRINE');
		expect(normalizeProductSku('dev react 001')).toBe('DEV-REACT-001');
	});

	it('valide le format catalogue', () => {
		expect(isValidProductSku('STACK-MVP-REACT-NEST')).toBe(true);
		expect(isValidProductSku('ADDON-SEO-BASIQUE')).toBe(true);
		expect(isValidProductSku('DEV-REACT-001')).toBe(true);
	});

	it('rejette les formats invalides', () => {
		expect(isValidProductSku('')).toBe(false);
		expect(isValidProductSku('P1')).toBe(false);
		expect(isValidProductSku('DEV')).toBe(false);
		expect(isValidProductSku('DEV_001')).toBe(false);
	});
});
