import {
	buildPayableDebtEmailLegalHtml,
	buildPayableDebtEmailLegalPlain,
	buildPayableDebtRgpdLine,
} from './payable-debt-legal.util';

describe('payable-debt-legal.util', () => {
	it('inclut prescription et reconnaissance dans le HTML', () => {
		const html = buildPayableDebtEmailLegalHtml();
		expect(html).toContain('2240');
		expect(html).toContain('2224');
		expect(html).toContain('Informations juridiques');
	});

	it('inclut le contact RGPD quand renseigné', () => {
		const line = buildPayableDebtRgpdLine({
			legalName: 'SARL Test',
			dataControllerEmail: 'dpo@test.fr',
		});
		expect(line).toContain('dpo@test.fr');
	});

	it('version texte pour clients mail en plain', () => {
		const text = buildPayableDebtEmailLegalPlain();
		expect(text).toContain('Prescription');
		expect(text).toContain('Données personnelles');
	});
});
