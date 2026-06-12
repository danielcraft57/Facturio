import {
	assertValidInstallmentSchedule,
	buildEqualInstallmentSchedule,
	resolveInstallmentsCoveredByPayment,
	resolveOnlineInstallmentAmount,
} from './invoice-installment.util';

describe('invoice-installment.util', () => {
	it('valide un échéancier dont la somme égale le total', () => {
		expect(() =>
			assertValidInstallmentSchedule(
				[
					{ amount: 500, dueDate: '2026-07-01' },
					{ amount: 500, dueDate: '2026-08-01' },
				],
				1000,
			),
		).not.toThrow();
	});

	it('refuse une somme différente du total', () => {
		expect(() =>
			assertValidInstallmentSchedule(
				[
					{ amount: 400, dueDate: '2026-07-01' },
					{ amount: 500, dueDate: '2026-08-01' },
				],
				1000,
			),
		).toThrow(/somme des échéances/);
	});

	it('répartit 3 parts égales avec reliquat sur la dernière', () => {
		const rows = buildEqualInstallmentSchedule(1000, 3, new Date('2026-07-15'));
		const sum = rows.reduce((s, r) => s + r.amount, 0);
		expect(rows).toHaveLength(3);
		expect(sum).toBe(1000);
	});

	it('couvre les échéances FIFO', () => {
		const covered = resolveInstallmentsCoveredByPayment(
			[
				{ id: 1, amount: 300 },
				{ id: 2, amount: 300 },
			],
			600,
		);
		expect(covered).toEqual([1, 2]);
	});

	it('montant en ligne = prochaine échéance', () => {
		expect(resolveOnlineInstallmentAmount(900, 300)).toBe(300);
		expect(resolveOnlineInstallmentAmount(200, 300)).toBe(200);
	});
});
