import { canAccessInvoiceByPublicToken } from './invoice-public-access.util';

describe('canAccessInvoiceByPublicToken', () => {
	it('autorise une SOL avec token sans sentAt', () => {
		expect(
			canAccessInvoiceByPublicToken({
				publicToken: 'abc',
				sentAt: null,
				status: 'DRAFT',
				tags: JSON.stringify(['SOLDE_APRES_ACOMPTE', 'PENDING_EMIT']),
			}),
		).toBe(true);
	});

	it('refuse sans token', () => {
		expect(
			canAccessInvoiceByPublicToken({
				publicToken: null,
				sentAt: new Date(),
				status: 'SENT',
				tags: null,
			}),
		).toBe(false);
	});
});
