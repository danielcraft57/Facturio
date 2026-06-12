/** Ligne d'échéancier en entrée (API / service). */
export interface InvoiceInstallmentInput {
	amount: number;
	dueDate: string | Date;
}

import type {
	InstallmentAccountingLink,
	InstallmentReceivableLink,
} from './invoice-installment-finance.util';

/** Échéance sérialisée pour l'API. */
export interface InvoiceInstallmentDto {
	id: number;
	sequence: number;
	amount: number;
	dueDate: string;
	status: 'PENDING' | 'PAID' | 'CANCELLED';
	paymentId: number | null;
	paidAt: string | null;
	overdue: boolean;
	/** Créance analytique (échéance en attente). */
	receivable?: InstallmentReceivableLink | null;
	/** Écriture d'encaissement liée au paiement de l'échéance. */
	accounting?: InstallmentAccountingLink | null;
}

/** Réponse enrichie liste échéancier (compta + créances). */
export type InvoiceInstallmentsFinanceResponse = {
	installments: InvoiceInstallmentDto[];
	saleAccounting: InstallmentAccountingLink | null;
};

const AMOUNT_EPSILON = 0.01;

/**
 * Valide un plan d'échéances par rapport au total TTC de la facture.
 *
 * @param installments - Échéances proposées (au moins 2)
 * @param invoiceTotal - Total TTC de la facture
 * @throws {Error} Si le plan est invalide
 */
export function assertValidInstallmentSchedule(
	installments: InvoiceInstallmentInput[],
	invoiceTotal: number,
): void {
	if (!installments?.length || installments.length < 2) {
		throw new Error('Un échéancier doit comporter au moins 2 échéances');
	}
	if (installments.length > 24) {
		throw new Error('Maximum 24 échéances par facture');
	}

	let sum = 0;
	let previousDue: number | null = null;
	for (let i = 0; i < installments.length; i++) {
		const row = installments[i];
		const amount = Number(row.amount);
		if (!Number.isFinite(amount) || amount <= 0) {
			throw new Error(`Échéance ${i + 1} : montant invalide`);
		}
		const due = new Date(row.dueDate);
		if (Number.isNaN(due.getTime())) {
			throw new Error(`Échéance ${i + 1} : date invalide`);
		}
		const dueMs = due.getTime();
		if (previousDue != null && dueMs < previousDue) {
			throw new Error('Les dates d’échéance doivent être chronologiques');
		}
		previousDue = dueMs;
		sum += amount;
	}

	if (Math.abs(sum - invoiceTotal) > AMOUNT_EPSILON) {
		throw new Error(
			`La somme des échéances (${sum.toFixed(2)} €) doit égaler le total TTC (${invoiceTotal.toFixed(2)} €)`,
		);
	}
}

/**
 * Répartit un montant de paiement sur les échéances en attente (FIFO par séquence).
 *
 * @param pending - Échéances PENDING triées par sequence
 * @param paymentAmount - Montant encaissé
 * @returns Identifiants des échéances soldées entièrement
 */
export function resolveInstallmentsCoveredByPayment(
	pending: { id: number; amount: number }[],
	paymentAmount: number,
): number[] {
	let remaining = paymentAmount;
	const covered: number[] = [];
	for (const row of pending) {
		if (remaining + AMOUNT_EPSILON < row.amount) break;
		covered.push(row.id);
		remaining = Number((remaining - row.amount).toFixed(2));
	}
	return covered;
}

/**
 * Calcule le montant à encaisser en ligne lorsqu'un échéancier est actif.
 *
 * @param invoiceBalance - Solde restant sur la facture
 * @param nextPendingAmount - Montant de la prochaine échéance
 */
export function resolveOnlineInstallmentAmount(
	invoiceBalance: number,
	nextPendingAmount: number | null,
): number {
	if (nextPendingAmount == null || nextPendingAmount <= 0) {
		return Math.max(0, invoiceBalance);
	}
	return Math.max(0, Math.min(invoiceBalance, nextPendingAmount));
}

/**
 * Indique si une échéance PENDING est en retard.
 *
 * @param dueDate - Date d'échéance
 * @param status - Statut stocké
 * @param now - Date de référence (tests)
 */
export function isInstallmentOverdue(
	dueDate: Date,
	status: string,
	now: Date = new Date(),
): boolean {
	if (status !== 'PENDING') return false;
	const today = new Date(now);
	today.setHours(0, 0, 0, 0);
	const due = new Date(dueDate);
	due.setHours(0, 0, 0, 0);
	return due.getTime() < today.getTime();
}

/**
 * Génère N échéances égales à partir d'un total et d'une première date d'échéance.
 *
 * @param total - Total TTC à répartir
 * @param count - Nombre d'échéances (2–24)
 * @param firstDueDate - Date de la première échéance
 * @param intervalMonths - Espacement en mois entre chaque échéance
 */
export function buildEqualInstallmentSchedule(
	total: number,
	count: number,
	firstDueDate: Date,
	intervalMonths = 1,
): InvoiceInstallmentInput[] {
	if (count < 2 || count > 24) {
		throw new Error('Le nombre d’échéances doit être entre 2 et 24');
	}
	const base = Math.floor((total / count) * 100) / 100;
	const rows: InvoiceInstallmentInput[] = [];
	let allocated = 0;
	for (let i = 0; i < count; i++) {
		const due = new Date(firstDueDate);
		due.setMonth(due.getMonth() + i * intervalMonths);
		const amount =
			i === count - 1 ? Number((total - allocated).toFixed(2)) : base;
		allocated += amount;
		rows.push({ amount, dueDate: due });
	}
	return rows;
}
