import {
	applyDepositToFirstInstallment,
	buildQuoteAcceptInstallmentSchedule,
	MIN_INSTALLMENT_TOTAL,
	resolveQuoteInstallmentInitialPayment,
	suggestSmartInstallmentPlan,
} from './quote-smart-installment.util';

describe('quote-smart-installment.util', () => {
	it('suggestSmartInstallmentPlan — paliers par montant', () => {
		expect(suggestSmartInstallmentPlan(250)).toBeNull();
		expect(suggestSmartInstallmentPlan(400)?.count).toBe(2);
		expect(suggestSmartInstallmentPlan(800)?.count).toBe(3);
		expect(suggestSmartInstallmentPlan(1500)?.count).toBe(3);
		expect(suggestSmartInstallmentPlan(3500)?.count).toBe(4);
		expect(suggestSmartInstallmentPlan(6000)?.count).toBe(6);
		expect(suggestSmartInstallmentPlan(15000)?.count).toBe(10);
		expect(MIN_INSTALLMENT_TOTAL).toBe(300);
	});

	it('applyDepositToFirstInstallment — conserve le total TTC', () => {
		const rows = applyDepositToFirstInstallment(
			[
				{ amount: 333.33, dueDate: '2026-04-01' },
				{ amount: 333.33, dueDate: '2026-05-01' },
				{ amount: 333.34, dueDate: '2026-06-01' },
			],
			1000,
			100,
		);
		const sum = rows.reduce((s, r) => s + r.amount, 0);
		expect(rows[0].amount).toBe(233.33);
		expect(sum).toBeCloseTo(1000, 2);
	});

	it('buildQuoteAcceptInstallmentSchedule — acompte en 1re ligne puis mensualités', () => {
		const acceptedAt = new Date('2026-03-01T12:00:00.000Z');
		const rows = buildQuoteAcceptInstallmentSchedule(1188, acceptedAt, {
			withDeposit: true,
			depositRate: 0.1,
		});
		expect(rows).toHaveLength(4);
		expect(rows[0].amount).toBeCloseTo(118.8, 2);
		const sum = rows.reduce((s, r) => s + r.amount, 0);
		expect(sum).toBeCloseTo(1188, 2);
	});

	it('resolveQuoteInstallmentInitialPayment — acompte ou 1re échéance', () => {
		const rows = [
			{ amount: 118.8, dueDate: '2026-03-01' },
			{ amount: 534.6, dueDate: '2026-04-01' },
			{ amount: 534.6, dueDate: '2026-05-01' },
		];
		expect(resolveQuoteInstallmentInitialPayment(1188, rows, true, 0.1)).toBe(118.8);
		expect(resolveQuoteInstallmentInitialPayment(800, [{ amount: 400, dueDate: '2026-04-01' }, { amount: 400, dueDate: '2026-05-01' }], false)).toBe(400);
	});
});
