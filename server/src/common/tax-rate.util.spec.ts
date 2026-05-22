import { normalizeTaxRateDecimal } from './tax-rate.util';

describe('normalizeTaxRateDecimal', () => {
	it('laisse un décimal ≤ 1', () => {
		expect(normalizeTaxRateDecimal(0.2)).toBe(0.2);
	});

	it('convertit un pourcentage entier', () => {
		expect(normalizeTaxRateDecimal(20)).toBe(0.2);
	});
});
