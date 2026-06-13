import { parseTagsJson } from '../common/document-folder.util';

/** Statuts possibles d'une ligne d'échéancier métier. */
export type InstallmentStoredStatus = 'SCHEDULED' | 'PENDING' | 'PAID' | 'CANCELLED';

/**
 * Statut initial d'une ligne à la création du plan (libération séquentielle).
 *
 * @param sequence - Numéro d'échéance (1-based)
 * @param options - sequentialRelease : mensualités 2+ en SCHEDULED ; deferFirst : même la 1re
 */
export function resolveInitialInstallmentStatus(
	sequence: number,
	options?: { sequentialRelease?: boolean; deferFirst?: boolean },
): InstallmentStoredStatus {
	const sequential = options?.sequentialRelease !== false;
	if (!sequential) return 'PENDING';
	if (sequence === 1 && !options?.deferFirst) return 'PENDING';
	return 'SCHEDULED';
}

/**
 * Indique si une facture ECH liée à un devis attend encore l'acompte ACO.
 *
 * @param invoiceTags - Tags JSON de la facture ECH
 */
export function isInstallmentAwaitingDeposit(invoiceTags: string | null): boolean {
	const tags = parseTagsJson(invoiceTags);
	return tags.includes('ECHEANCIER') && tags.includes('PENDING_EMIT');
}

/**
 * Vérifie si une échéance SCHEDULED peut être activée (PENDING).
 *
 * @param row - Ligne candidate
 * @param allRows - Toutes les lignes du plan triées par sequence
 * @param invoiceTags - Tags de la facture parente
 */
export function canReleaseInstallment(
	row: { sequence: number; status: string },
	allRows: { sequence: number; status: string }[],
	invoiceTags: string | null,
): boolean {
	if (row.status !== 'SCHEDULED') return false;
	if (isInstallmentAwaitingDeposit(invoiceTags)) return false;

	for (const prev of allRows) {
		if (prev.sequence >= row.sequence) continue;
		if (prev.status !== 'PAID') return false;
	}
	return true;
}

/**
 * Indique si le cron peut activer une échéance SCHEDULED (fenêtre J-N).
 *
 * @param dueDate - Date d'échéance de la ligne
 * @param remindDaysBefore - Jours avant échéance (défaut 3)
 * @param now - Date de référence
 */
export function shouldAutoReleaseScheduledInstallment(
	dueDate: Date,
	remindDaysBefore: number,
	now: Date = new Date(),
): boolean {
	const today = new Date(now);
	today.setHours(0, 0, 0, 0);
	const due = new Date(dueDate);
	due.setHours(0, 0, 0, 0);
	const daysUntil = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
	return daysUntil <= remindDaysBefore;
}
