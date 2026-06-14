import { isInstallmentOverdue } from './invoice-installment.util';

/** Résumé léger d'un échéancier pour les listes factures. */
export interface InvoiceInstallmentSummary {
	hasPlan: boolean;
	totalCount: number;
	pendingCount: number;
	scheduledCount: number;
	paidCount: number;
	nextSequence: number | null;
	nextAmount: number | null;
	nextDueDate: string | null;
	hasOverdue: boolean;
}

/**
 * Agrège les lignes d'échéances en résumé affichable (liste, badge).
 *
 * @param rows - Échéances triées par sequence
 */
export function buildInvoiceInstallmentSummary(
	rows: {
		sequence: number;
		amount: unknown;
		dueDate: Date;
		status: string;
	}[],
): InvoiceInstallmentSummary | null {
	if (!rows.length) return null;

	const pending = rows.filter((r) => r.status === 'PENDING');
	const scheduledCount = rows.filter((r) => r.status === 'SCHEDULED').length;
	const paidCount = rows.filter((r) => r.status === 'PAID').length;
	const next = pending[0] ?? null;
	const hasOverdue = pending.some((r) => isInstallmentOverdue(r.dueDate, r.status));

	return {
		hasPlan: true,
		totalCount: rows.length,
		pendingCount: pending.length,
		scheduledCount,
		paidCount,
		nextSequence: next?.sequence ?? null,
		nextAmount: next ? Number(next.amount) : null,
		nextDueDate: next ? next.dueDate.toISOString() : null,
		hasOverdue,
	};
}
