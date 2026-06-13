import {
	assertValidInstallmentSchedule,
	buildEqualInstallmentSchedule,
	type InvoiceInstallmentInput,
} from '../invoices/invoice-installment.util';
import { computeInvoiceDueDate } from '../invoices/invoice-due-date.util';

/** Plan d'échéancier suggéré selon le montant TTC du devis. */
export type SmartInstallmentPlan = {
	count: number;
	intervalMonths: number;
	label: string;
};

/** Montant TTC minimum pour proposer le paiement en plusieurs fois. */
export const MIN_INSTALLMENT_TOTAL = 300;

/** Montant minimum par mensualité (évite des échéances ridicules). */
const MIN_INSTALLMENT_AMOUNT = 50;

/**
 * Nombre max d'échéances selon le montant et un plancher par ligne.
 *
 * @param totalTtc - Total TTC
 */
function capInstallmentCount(totalTtc: number, desired: number): number {
	const maxByAmount = Math.max(2, Math.floor(totalTtc / MIN_INSTALLMENT_AMOUNT));
	return Math.min(desired, maxByAmount);
}

/**
 * Propose un nombre d'échéances adapté au montant TTC (devis B2B).
 *
 * @param totalTtc - Total TTC du devis
 */
export function suggestSmartInstallmentPlan(totalTtc: number): SmartInstallmentPlan | null {
	const total = Number(totalTtc);
	if (!Number.isFinite(total) || total < MIN_INSTALLMENT_TOTAL) return null;

	let count: number;
	if (total < 800) {
		count = 2;
	} else if (total < 2000) {
		count = 3;
	} else if (total < 5000) {
		count = 4;
	} else if (total < 12000) {
		count = 6;
	} else {
		count = 10;
	}

	count = capInstallmentCount(total, count);
	if (count < 2) return null;

	return {
		count,
		intervalMonths: 1,
		label: `${count} mensualités`,
	};
}

/**
 * Échéancier ECH après acompte ACO séparé : 1re mensualité réduite du montant acompte,
 * les suivantes répartissent le solde (somme = total devis − acompte).
 *
 * @param quoteTotal - Total TTC du devis
 * @param depositAmount - Montant déjà facturé sur ACO
 * @param acceptedAt - Date d'acceptation
 * @param options - deferFirstDue : 1re mensualité à J+30
 */
export function buildQuoteInstallmentScheduleAfterDeposit(
	quoteTotal: number,
	depositAmount: number,
	acceptedAt: Date,
	options?: { deferFirstDue?: boolean },
): InvoiceInstallmentInput[] {
	const plan = suggestSmartInstallmentPlan(quoteTotal);
	if (!plan) {
		throw new Error('Montant insuffisant pour un échéancier');
	}
	const deposit = Number(depositAmount.toFixed(2));
	const remainder = Number((quoteTotal - deposit).toFixed(2));
	if (remainder < MIN_INSTALLMENT_AMOUNT * 2) {
		throw new Error('Montant trop faible pour combiner acompte et mensualités');
	}

	const deferFirstDue = Boolean(options?.deferFirstDue);
	const firstDue = deferFirstDue
		? computeInvoiceDueDate('days_30', { baseDate: acceptedAt })
		: computeInvoiceDueDate('on_acceptance', { baseDate: acceptedAt });

	const equalOnFull = buildEqualInstallmentSchedule(
		quoteTotal,
		plan.count,
		firstDue,
		plan.intervalMonths,
	);
	let firstAmount = Number((equalOnFull[0].amount - deposit).toFixed(2));
	if (firstAmount < 0.01) {
		throw new Error('Acompte trop élevé par rapport à la première mensualité');
	}

	if (plan.count === 1) {
		throw new Error('Plan invalide');
	}

	if (plan.count === 2) {
		const secondAmount = Number((remainder - firstAmount).toFixed(2));
		const secondDue = new Date(firstDue);
		secondDue.setMonth(secondDue.getMonth() + plan.intervalMonths);
		const rows = [
			{ amount: firstAmount, dueDate: firstDue },
			{ amount: secondAmount, dueDate: secondDue },
		];
		assertValidInstallmentSchedule(rows, remainder);
		return rows;
	}

	const tailTotal = Number((remainder - firstAmount).toFixed(2));
	const tailFirstDue = new Date(firstDue);
	tailFirstDue.setMonth(tailFirstDue.getMonth() + plan.intervalMonths);
	const tailRows = buildEqualInstallmentSchedule(
		tailTotal,
		plan.count - 1,
		tailFirstDue,
		plan.intervalMonths,
	);

	const rows: InvoiceInstallmentInput[] = [
		{ amount: firstAmount, dueDate: firstDue },
		...tailRows,
	];
	assertValidInstallmentSchedule(rows, remainder);
	return rows;
}

/**
 * Construit l'échéancier sur une facture ECH (montant = total ou solde selon le cas).
 *
 * @param totalTtc - Montant TTC couvert par la facture ECH
 * @param acceptedAt - Date d'acceptation du devis
 * @param options - deferFirstDue : 1re mensualité à J+30
 */
export function buildQuoteAcceptInstallmentSchedule(
	totalTtc: number,
	acceptedAt: Date,
	options?: { deferFirstDue?: boolean },
): InvoiceInstallmentInput[] {
	const plan = suggestSmartInstallmentPlan(totalTtc);
	if (!plan) {
		throw new Error('Montant insuffisant pour un échéancier');
	}

	const deferFirstDue = Boolean(options?.deferFirstDue);
	const firstDue = deferFirstDue
		? computeInvoiceDueDate('days_30', { baseDate: acceptedAt })
		: computeInvoiceDueDate('on_acceptance', { baseDate: acceptedAt });

	return buildEqualInstallmentSchedule(
		totalTtc,
		plan.count,
		firstDue,
		plan.intervalMonths,
	);
}

/**
 * Montant à régler en ligne juste après acceptation (1re échéance ECH ou acompte ACO).
 *
 * @param rows - Échéances de la facture ECH
 */
export function resolveQuoteInstallmentInitialPayment(rows: InvoiceInstallmentInput[]): number {
	return Number(rows[0]?.amount ?? 0);
}
