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
 * Paliers pensés pour les petits devis (2x dès 300 €) et les gros (jusqu'à 10x).
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
 * Réduit la première échéance du montant d'acompte et rééquilibre la dernière ligne.
 * Conservé pour les tests et d'éventuels plans manuels.
 *
 * @param rows - Échéances (somme = total)
 * @param total - Total TTC facture
 * @param depositAmount - Acompte versé à la commande
 */
export function applyDepositToFirstInstallment(
	rows: InvoiceInstallmentInput[],
	total: number,
	depositAmount: number,
): InvoiceInstallmentInput[] {
	if (depositAmount <= 0) return rows;

	const deposit = Number(depositAmount.toFixed(2));
	const copy = rows.map((row) => ({
		amount: Number(row.amount),
		dueDate: row.dueDate,
	}));

	copy[0].amount = Number((copy[0].amount - deposit).toFixed(2));
	if (copy[0].amount < 0.01) {
		throw new Error('Acompte trop élevé par rapport à la première échéance');
	}

	const sumExceptLast = copy.slice(0, -1).reduce((sum, row) => sum + row.amount, 0);
	copy[copy.length - 1].amount = Number((total - sumExceptLast).toFixed(2));

	assertValidInstallmentSchedule(copy, total);
	return copy;
}

/**
 * Construit l'échéancier à appliquer sur la facture issue d'un devis accepté.
 * Avec acompte : 1re ligne = acompte à régler tout de suite, puis mensualités sur le solde.
 *
 * @param totalTtc - Total TTC
 * @param acceptedAt - Date d'acceptation
 * @param options - Acompte optionnel à la commande
 */
export function buildQuoteAcceptInstallmentSchedule(
	totalTtc: number,
	acceptedAt: Date,
	options?: { withDeposit?: boolean; depositRate?: number },
): InvoiceInstallmentInput[] {
	const plan = suggestSmartInstallmentPlan(totalTtc);
	if (!plan) {
		throw new Error('Montant insuffisant pour un échéancier');
	}

	const withDeposit = Boolean(options?.withDeposit);

	if (withDeposit) {
		const rate = options?.depositRate ?? 0.1;
		if (rate <= 0 || rate >= 1) {
			throw new Error('depositRate invalide');
		}
		const depositAmount = Number((totalTtc * rate).toFixed(2));
		const remaining = Number((totalTtc - depositAmount).toFixed(2));
		if (remaining < MIN_INSTALLMENT_AMOUNT * 2) {
			throw new Error('Montant trop faible pour combiner acompte et mensualités');
		}
		const firstDue = computeInvoiceDueDate('days_30', { baseDate: acceptedAt });
		const monthlyRows = buildEqualInstallmentSchedule(
			remaining,
			plan.count,
			firstDue,
			plan.intervalMonths,
		);
		const rows: InvoiceInstallmentInput[] = [
			{
				amount: depositAmount,
				dueDate: computeInvoiceDueDate('on_acceptance', { baseDate: acceptedAt }),
			},
			...monthlyRows,
		];
		assertValidInstallmentSchedule(rows, totalTtc);
		return rows;
	}

	const firstDue = computeInvoiceDueDate('on_acceptance', { baseDate: acceptedAt });
	const rows = buildEqualInstallmentSchedule(
		totalTtc,
		plan.count,
		firstDue,
		plan.intervalMonths,
	);
	return rows;
}

/**
 * Montant à régler en ligne juste après acceptation (acompte ou 1re échéance).
 *
 * @param _totalTtc - Total TTC (conservé pour compatibilité API)
 * @param rows - Échéancier retenu
 * @param withDeposit - Acompte à la commande
 * @param depositRate - Taux d'acompte
 */
export function resolveQuoteInstallmentInitialPayment(
	_totalTtc: number,
	rows: InvoiceInstallmentInput[],
	withDeposit: boolean,
	depositRate = 0.1,
): number {
	if (withDeposit && rows.length > 0) {
		return Number(rows[0].amount);
	}
	if (withDeposit) {
		return Number((_totalTtc * depositRate).toFixed(2));
	}
	return Number(rows[0]?.amount ?? 0);
}
