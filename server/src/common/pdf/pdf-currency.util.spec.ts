import { formatPdfCurrency } from './pdf-currency.util';

describe('formatPdfCurrency', () => {
	it('formate sans espace fine insécable (U+202F)', () => {
		const s = formatPdfCurrency(1100);
		expect(s).not.toMatch(/\u202F/);
		expect(s).toBe('1\u00A0100,00\u00A0€');
	});

	it('formate les petits montants', () => {
		expect(formatPdfCurrency(100)).toBe('100,00\u00A0€');
	});
});
