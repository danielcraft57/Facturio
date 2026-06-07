/** Dossiers boîte mail (flags utilisateur). */
export type DocumentMailboxFolder =
  | 'inbox'
  | 'nouveau'
  | 'suivi'
  | 'attente'
  | 'important'
  | 'envoyes'
  | 'brouillons'

/** Dossiers filtrés par statut affiché (alignés sur les badges liste). */
export type DocumentStatusFolder =
  | 'status_draft'
  | 'status_sent'
  | 'status_viewed'
  | 'status_clicked'
  | 'status_accepted'
  | 'status_rejected'
  | 'status_expired'
  | 'status_overdue'
  | 'status_paid'
  | 'status_cancelled'
  | 'status_partial'

export type DocumentFolder = DocumentMailboxFolder | DocumentStatusFolder

export type DocumentFolderCounts = Record<DocumentFolder, number> & {
  archives: number
}

export function formatDocumentFolderCount(count: number, cap = 100): string {
  if (count > cap) return `${cap}+`
  return String(count)
}

const MAILBOX_KEYS: DocumentMailboxFolder[] = [
  'inbox',
  'nouveau',
  'suivi',
  'attente',
  'important',
  'envoyes',
  'brouillons',
]

const STATUS_KEYS: DocumentStatusFolder[] = [
  'status_draft',
  'status_sent',
  'status_viewed',
  'status_clicked',
  'status_accepted',
  'status_rejected',
  'status_expired',
  'status_overdue',
  'status_paid',
  'status_cancelled',
  'status_partial',
]

export const DOCUMENT_MAILBOX_FOLDERS = MAILBOX_KEYS
export const DOCUMENT_STATUS_FOLDERS = STATUS_KEYS
export const DOCUMENT_FOLDERS: DocumentFolder[] = [...MAILBOX_KEYS, ...STATUS_KEYS]

export function normalizeDocumentFolderCounts(
  raw?: Partial<DocumentFolderCounts> | null,
): DocumentFolderCounts {
  const base = Object.fromEntries(DOCUMENT_FOLDERS.map((k) => [k, raw?.[k] ?? 0])) as Record<
    DocumentFolder,
    number
  >
  return { ...base, archives: raw?.archives ?? 0 }
}

export const DOCUMENT_FOLDER_LABELS: Record<DocumentFolder, string> = {
  inbox: 'Tous',
  nouveau: 'Non lus',
  suivi: 'Suivi',
  attente: 'Reportés',
  important: 'Important',
  envoyes: 'Envoyés',
  brouillons: 'Brouillons',
  status_draft: 'Brouillon',
  status_sent: 'Envoyé',
  status_viewed: 'Vu',
  status_clicked: 'Cliqué',
  status_accepted: 'Accepté',
  status_rejected: 'Refusé',
  status_expired: 'Expiré',
  status_overdue: 'En retard',
  status_paid: 'Payée',
  status_cancelled: 'Annulée',
  status_partial: 'Partiel',
}

export const DEFAULT_DOCUMENT_TAGS = [
  'relance',
  'vip',
  'comptabilité',
  'e-commerce',
  'urgent',
] as const

const FOLDER_SET = new Set<string>(DOCUMENT_FOLDERS)

export function isDocumentFolder(value: string | undefined): value is DocumentFolder {
  return value != null && FOLDER_SET.has(value)
}

export type DocumentFlags = {
  starred?: boolean
  important?: boolean
  snoozedUntil?: string | null
  tags?: string[]
  markSeen?: boolean
}

/** Tri côté client : plus récent en premier. */
export function sortOutgoingNewestFirst<
  T extends { createdAt?: string; sentAt?: string | null; date?: string },
>(items: T[]): T[] {
  const ts = (x: T) => new Date(x.sentAt ?? x.createdAt ?? x.date ?? 0).getTime()
  return [...items].sort((a, b) => ts(b) - ts(a))
}
