import type { ReceivableAgingBucket } from '../services/receivables'

/** Libellé court pour une écriture comptable liée à une échéance. */
export function formatInstallmentAccountingLabel(
  journalCode: string,
  reference: string,
  posted: boolean,
): string {
  const shortRef = reference.length > 28 ? `${reference.slice(0, 25)}…` : reference
  return posted ? `${journalCode} · ${shortRef}` : `${journalCode} · en attente`
}

/** Libellé créance analytique par échéance. */
export function formatInstallmentReceivableLabel(
  agingBucket: ReceivableAgingBucket,
  daysPastDue: number,
): string {
  if (daysPastDue > 0) return `Créance auto · ${daysPastDue} j de retard`
  if (agingBucket === 'not_due') return 'Créance auto · à échoir'
  return 'Créance auto · suivi actif'
}
