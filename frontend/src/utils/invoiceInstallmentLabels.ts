/** Résumé échéancier renvoyé par l'API liste factures. */
export interface InvoiceInstallmentSummary {
  hasPlan: boolean
  totalCount: number
  pendingCount: number
  paidCount: number
  nextSequence: number | null
  nextAmount: number | null
  nextDueDate: string | null
  hasOverdue: boolean
}

/**
 * Libellé court pour le badge liste factures.
 *
 * @param summary - Résumé échéancier
 */
export function installmentBadgeLabel(summary: InvoiceInstallmentSummary): string {
  if (summary.hasOverdue) {
    return summary.nextSequence
      ? `Éch. ${summary.nextSequence} en retard`
      : 'Échéance en retard'
  }
  if (summary.pendingCount === 0 && summary.paidCount > 0) {
    return `${summary.totalCount}x réglé`
  }
  if (summary.nextSequence != null) {
    return `Éch. ${summary.nextSequence}/${summary.totalCount}`
  }
  return `${summary.totalCount} échéances`
}

/**
 * Date à afficher en colonne « Échéance » (prochaine échéance métier si plan actif).
 */
export function resolveInvoiceDueDisplay(
  invoiceDueDate: string | undefined,
  summary?: InvoiceInstallmentSummary | null,
): string | null {
  if (summary?.nextDueDate) return summary.nextDueDate
  return invoiceDueDate ?? null
}
