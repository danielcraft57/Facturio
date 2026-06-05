import { computeDebtBalance } from './payables-balance.util';

describe('computeDebtBalance', () => {
	it('dette ouverte sans paiement', () => {
		const r = computeDebtBalance(164.52, []);
		expect(r.balance).toBe(164.52);
		expect(r.status).toBe('OPEN');
		expect(r.totalPaid).toBe(0);
	});

	it('paiement partiel 50 € sur 164,52 €', () => {
		const r = computeDebtBalance(164.52, [50]);
		expect(r.balance).toBe(114.52);
		expect(r.status).toBe('PARTIAL');
		expect(r.totalPaid).toBe(50);
	});

	it('dette soldée', () => {
		const r = computeDebtBalance(164.52, [50, 114.52]);
		expect(r.balance).toBe(0);
		expect(r.status).toBe('PAID');
	});
});
