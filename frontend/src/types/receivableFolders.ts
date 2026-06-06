import type { ReceivableAgingBucket, ReceivableDocumentKind } from '../services/receivables'

/** Dossiers de navigation du module Créances (filtres regroupés). */
export type ReceivableFolder =
  | 'tous'
  | 'not_due'
  | 'overdue'
  | 'days_0_30'
  | 'days_31_60'
  | 'days_61_90'
  | 'days_90_plus'
  | 'status_sent'
  | 'status_overdue'
  | 'status_draft'
  | 'kind_deposit'
  | 'kind_remainder'
  | 'kind_standard'

export type ReceivableFolderGroupId = 'vue' | 'anciennete' | 'statut' | 'type'

export type ReceivableFolderCounts = Record<ReceivableFolder, number>

export const RECEIVABLE_FOLDER_LABELS: Record<ReceivableFolder, string> = {
  tous: 'Toutes',
  not_due: 'À échoir',
  overdue: 'En retard',
  days_0_30: '0–30 j',
  days_31_60: '31–60 j',
  days_61_90: '61–90 j',
  days_90_plus: '+90 j',
  status_sent: 'Envoyée',
  status_overdue: 'En retard',
  status_draft: 'Brouillon',
  kind_deposit: 'Acomptes',
  kind_remainder: 'Soldes',
  kind_standard: 'Factures',
}

export const RECEIVABLE_FOLDER_SUBTITLES: Record<ReceivableFolder, string> = {
  tous: 'Toutes les factures impayées — les plus urgentes en premier',
  not_due: 'Échéance non dépassée — suivi préventif',
  overdue: 'Échéance dépassée — relances et encaissement',
  days_0_30: 'Retard de 0 à 30 jours',
  days_31_60: 'Retard de 31 à 60 jours',
  days_61_90: 'Retard de 61 à 90 jours',
  days_90_plus: 'Retard de plus de 90 jours',
  status_sent: 'Factures envoyées, encore impayées',
  status_overdue: 'Factures marquées en retard',
  status_draft: 'Créances brouillon (ex. solde après acompte)',
  kind_deposit: 'Acomptes dus — échéance à l’acceptation du devis',
  kind_remainder: 'Soldes dus — échéance J+30 à l’envoi',
  kind_standard: 'Factures classiques impayées',
}

export const RECEIVABLE_FOLDER_GROUPS: Array<{
  id: ReceivableFolderGroupId
  label: string
  folders: ReceivableFolder[]
}> = [
  { id: 'vue', label: 'Vue', folders: ['tous', 'not_due', 'overdue'] },
  {
    id: 'anciennete',
    label: 'Ancienneté',
    folders: ['days_0_30', 'days_31_60', 'days_61_90', 'days_90_plus'],
  },
  {
    id: 'statut',
    label: 'Statut',
    folders: ['status_sent', 'status_overdue', 'status_draft'],
  },
  {
    id: 'type',
    label: 'Type',
    folders: ['kind_deposit', 'kind_remainder', 'kind_standard'],
  },
]

const RECEIVABLE_FOLDER_SET = new Set<string>(
  RECEIVABLE_FOLDER_GROUPS.flatMap((g) => g.folders),
)

export function isReceivableFolder(value: string | undefined): value is ReceivableFolder {
  return value != null && RECEIVABLE_FOLDER_SET.has(value)
}

export function agingBucketForFolder(
  folder: ReceivableFolder,
): ReceivableAgingBucket | null {
  if (
    folder === 'days_0_30' ||
    folder === 'days_31_60' ||
    folder === 'days_61_90' ||
    folder === 'days_90_plus' ||
    folder === 'not_due'
  ) {
    return folder
  }
  return null
}

export function documentKindForFolder(
  folder: ReceivableFolder,
): ReceivableDocumentKind | null {
  if (folder === 'kind_deposit') return 'deposit'
  if (folder === 'kind_remainder') return 'remainder'
  if (folder === 'kind_standard') return 'standard'
  return null
}
