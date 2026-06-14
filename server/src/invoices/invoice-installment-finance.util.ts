import {
	daysPastDue,
	receivableAgingBucket,
	type ReceivableAgingBucket,
} from '../receivables/receivables-aging.util';

/** Lien vers une écriture comptable postée (vente ou encaissement). */
export type InstallmentAccountingLink = {
	entryId: number;
	journalCode: string;
	reference: string;
	date: string;
	memo: string | null;
	kind: 'sale' | 'payment';
	posted: boolean;
};

/** Créance analytique suivie automatiquement pour une échéance en attente. */
export type InstallmentReceivableLink = {
	outstanding: number;
	agingBucket: ReceivableAgingBucket;
	daysPastDue: number;
	autoTracked: true;
};

/**
 * Référence comptable de la vente facture (journal VE).
 *
 * @param invoiceNumber - Numéro de facture
 */
export function invoiceSaleAccountingReference(invoiceNumber: string): string {
	return `VENTE ${invoiceNumber}`;
}

/**
 * Référence comptable d'un encaissement lié à un paiement.
 *
 * @param invoiceNumber - Numéro de facture
 * @param paymentId - Identifiant paiement
 */
export function invoicePaymentAccountingReference(invoiceNumber: string, paymentId: number): string {
	return `PAIEMENT ${invoiceNumber}#${paymentId}`;
}

/**
 * Construit la créance analytique d'une échéance PENDING.
 *
 * @param dueDate - Date d'échéance
 * @param amount - Montant de l'échéance
 * @param status - Statut stocké
 * @param asOf - Date de référence (tests)
 */
export function buildInstallmentReceivable(
	dueDate: Date,
	amount: number,
	status: string,
	asOf: Date = new Date(),
): InstallmentReceivableLink | null {
	if (status !== 'PENDING') return null;
	return {
		outstanding: amount,
		agingBucket: receivableAgingBucket(dueDate, asOf),
		daysPastDue: daysPastDue(dueDate, asOf),
		autoTracked: true,
	};
}
