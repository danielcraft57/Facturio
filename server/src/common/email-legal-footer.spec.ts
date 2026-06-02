import { buildEmailLegalFooter, resolveEmailIssuerDisplayName } from './email-legal-footer';

describe('email-legal-footer', () => {
	it('omits empty organization fields', () => {
		const footer = buildEmailLegalFooter({
			legalName: 'DanielCraft',
			address: '1 rue Test',
			zipCode: '59000',
			city: 'Lille',
			siret: '12345678901234',
			phone: '',
			email: null,
			vatNumber: undefined,
		});
		expect(footer).toContain('DanielCraft');
		expect(footer).toContain('59000');
		expect(footer).toContain('SIRET');
		expect(footer).not.toContain('Tél.');
		expect(footer).not.toContain('TVA');
		expect(footer).not.toContain('Email');
	});

	it('uses legalName for issuer display', () => {
		expect(
			resolveEmailIssuerDisplayName({ legalName: '  SARL Demo ', name: 'Demo' }),
		).toBe('SARL Demo');
	});
});
