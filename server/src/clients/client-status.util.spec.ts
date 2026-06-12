import { deriveClientStatus } from './client-status.util';

describe('deriveClientStatus', () => {
	it('garde inactif si archivé ou statut inactif', () => {
		expect(
			deriveClientStatus({
				storedStatus: 'ACTIVE',
				archived: true,
				paidInvoiceCount: 2,
				quoteCount: 0,
			}),
		).toBe('INACTIVE');
		expect(
			deriveClientStatus({
				storedStatus: 'INACTIVE',
				archived: false,
				paidInvoiceCount: 2,
				quoteCount: 0,
			}),
		).toBe('INACTIVE');
	});

	it('passe actif dès qu une facture est payée', () => {
		expect(
			deriveClientStatus({
				storedStatus: 'PROSPECT',
				archived: false,
				paidInvoiceCount: 1,
				quoteCount: 3,
			}),
		).toBe('ACTIVE');
	});

	it('reste prospect sans facture payée même avec des devis', () => {
		expect(
			deriveClientStatus({
				storedStatus: 'ACTIVE',
				archived: false,
				paidInvoiceCount: 0,
				quoteCount: 2,
			}),
		).toBe('PROSPECT');
	});
});
