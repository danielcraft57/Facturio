import {
	buildQuoteAcceptInstallmentSchedule,
	buildQuoteInstallmentScheduleAfterDeposit,
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

	it('buildQuoteInstallmentScheduleAfterDeposit — 1re mensualité réduite de l acompte', () => {
		const acceptedAt = new Date('2026-03-01T12:00:00.000Z');
		const rows = buildQuoteInstallmentScheduleAfterDeposit(1188, 118.8, acceptedAt, {
			deferFirstDue: true,
		});
		expect(rows).toHaveLength(3);
		expect(rows[0].amount).toBeCloseTo(277.2, 2);
		const sum = rows.reduce((s, r) => s + r.amount, 0);
		expect(sum).toBeCloseTo(1069.2, 2);
	});

	it('buildQuoteAcceptInstallmentSchedule — solde après acompte, sans ligne acompte', () => {
		const acceptedAt = new Date('2026-03-01T12:00:00.000Z');
		const rows = buildQuoteAcceptInstallmentSchedule(1069.2, acceptedAt, { deferFirstDue: true });
		expect(rows).toHaveLength(3);
		const sum = rows.reduce((s, r) => s + r.amount, 0);
		expect(sum).toBeCloseTo(1069.2, 2);
	});

	it('resolveQuoteInstallmentInitialPayment — 1re mensualité ECH', () => {
		const rows = [
			{ amount: 356.4, dueDate: '2026-04-01' },
			{ amount: 356.4, dueDate: '2026-05-01' },
		];
		expect(resolveQuoteInstallmentInitialPayment(rows)).toBe(356.4);
	});
});
