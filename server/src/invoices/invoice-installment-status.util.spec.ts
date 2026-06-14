import {
	canReleaseInstallment,
	resolveInitialInstallmentStatus,
	shouldAutoReleaseScheduledInstallment,
} from './invoice-installment-status.util';

describe('invoice-installment-status.util', () => {
	it('resolveInitialInstallmentStatus — séquentiel', () => {
		expect(resolveInitialInstallmentStatus(1, { sequentialRelease: true })).toBe('PENDING');
		expect(resolveInitialInstallmentStatus(2, { sequentialRelease: true })).toBe('SCHEDULED');
		expect(resolveInitialInstallmentStatus(1, { sequentialRelease: true, deferFirst: true })).toBe(
			'SCHEDULED',
		);
	});

	it('canReleaseInstallment — après paiement précédent', () => {
		const rows = [
			{ sequence: 1, status: 'PAID' },
			{ sequence: 2, status: 'SCHEDULED' },
		];
		expect(canReleaseInstallment(rows[1], rows, JSON.stringify(['ECHEANCIER']))).toBe(true);
	});

	it('canReleaseInstallment — bloqué si acompte non payé', () => {
		const rows = [{ sequence: 1, status: 'SCHEDULED' }];
		expect(
			canReleaseInstallment(rows[0], rows, JSON.stringify(['ECHEANCIER', 'PENDING_EMIT'])),
		).toBe(false);
	});

	it('shouldAutoReleaseScheduledInstallment — fenêtre J-3', () => {
		const due = new Date('2026-06-15T12:00:00.000Z');
		const now = new Date('2026-06-12T12:00:00.000Z');
		expect(shouldAutoReleaseScheduledInstallment(due, 3, now)).toBe(true);
		expect(shouldAutoReleaseScheduledInstallment(due, 3, new Date('2026-06-01'))).toBe(false);
	});
});
