import {
	buildInstallmentReceivable,
	invoicePaymentAccountingReference,
	invoiceSaleAccountingReference,
} from './invoice-installment-finance.util';

describe('invoice-installment-finance.util', () => {
	it('formate les références comptables vente et paiement', () => {
		expect(invoiceSaleAccountingReference('FAC-2026-001')).toBe('VENTE FAC-2026-001');
		expect(invoicePaymentAccountingReference('FAC-2026-001', 42)).toBe('PAIEMENT FAC-2026-001#42');
	});

	it('expose une créance auto pour une échéance PENDING', () => {
		const asOf = new Date('2026-03-15T12:00:00.000Z');
		const receivable = buildInstallmentReceivable(
			new Date('2026-03-01'),
			500,
			'PENDING',
			asOf,
		);
		expect(receivable).toEqual({
			outstanding: 500,
			agingBucket: 'days_0_30',
			daysPastDue: 14,
			autoTracked: true,
		});
	});

	it('ne crée pas de créance pour une échéance réglée', () => {
		expect(
			buildInstallmentReceivable(new Date('2026-03-01'), 500, 'PAID', new Date('2026-03-15')),
		).toBeNull();
	});
});
