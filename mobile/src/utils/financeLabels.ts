import { colors } from '../theme'
import type { ReceivableAgingBucket, ReceivableDocumentKind } from '../types/receivables'

export const AGING_BUCKET_LABELS: Record<ReceivableAgingBucket, string> = {
  not_due: 'À échoir',
  days_0_30: '0–30 j',
  days_31_60: '31–60 j',
  days_61_90: '61–90 j',
  days_90_plus: '+90 j',
}

export const RECEIVABLE_KIND_LABELS: Record<ReceivableDocumentKind, string> = {
  standard: 'Facture',
  deposit: 'Acompte',
  remainder: 'Solde',
}

export function agingBucketColor(bucket: ReceivableAgingBucket): { bg: string; text: string } {
  if (bucket === 'not_due') return { bg: colors.successBg, text: colors.success }
  if (bucket === 'days_0_30') return { bg: colors.warningBg, text: colors.warning }
  return { bg: colors.errorBg, text: colors.error }
}

export function payableStatusLabel(status: string): string {
  const key = status.toUpperCase()
  if (key === 'OPEN') return 'Ouverte'
  if (key === 'PARTIAL') return 'Partielle'
  if (key === 'PAID') return 'Payée'
  if (key === 'CANCELLED') return 'Annulée'
  return status
}
