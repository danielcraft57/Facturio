import type { PayableDebtStatus } from '@prisma/client';

const BALANCE_EPSILON = 0.01;

export function computeDebtBalance(
	totalAmount: number,
	paymentAmounts: number[],
): { balance: number; status: PayableDebtStatus; totalPaid: number } {
	const totalPaid = Number(
		paymentAmounts.reduce((sum, a) => sum + a, 0).toFixed(2),
	);
	const balance = Math.max(0, Number((totalAmount - totalPaid).toFixed(2)));

	let status: PayableDebtStatus;
	if (balance <= BALANCE_EPSILON) {
		status = 'PAID';
	} else if (totalPaid <= BALANCE_EPSILON) {
		status = 'OPEN';
	} else {
		status = 'PARTIAL';
	}

	return { balance, status, totalPaid };
}
