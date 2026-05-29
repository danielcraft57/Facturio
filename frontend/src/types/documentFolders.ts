/** Dossiers de classement pour factures / devis émis. */
export type DocumentFolder =
  | 'inbox'
  | 'nouveau'
  | 'suivi'
  | 'attente'
  | 'important'
  | 'envoyes'
  | 'brouillons'

export type DocumentFolderCounts = Record<DocumentFolder, number> & {
  archives: number
}

export function formatDocumentFolderCount(count: number, cap = 100): string {
  if (count > cap) return `${cap}+`
  return String(count)
}

export function normalizeDocumentFolderCounts(
  raw?: Partial<DocumentFolderCounts> | null,
): DocumentFolderCounts {
  return {
    inbox: raw?.inbox ?? 0,
    nouveau: raw?.nouveau ?? 0,
    suivi: raw?.suivi ?? 0,
    attente: raw?.attente ?? 0,
    important: raw?.important ?? 0,
    envoyes: raw?.envoyes ?? 0,
    brouillons: raw?.brouillons ?? 0,
    archives: raw?.archives ?? 0,
  }
}

export const DOCUMENT_FOLDER_LABELS: Record<DocumentFolder, string> = {
  inbox: 'Tous',
  nouveau: 'Non lus',
  suivi: 'Suivi',
  attente: 'Reportés',
  important: 'Important',
  envoyes: 'Envoyés',
  brouillons: 'Brouillons',
}

export const DOCUMENT_FOLDERS: DocumentFolder[] = [
  'inbox',
  'nouveau',
  'suivi',
  'attente',
  'important',
  'envoyes',
  'brouillons',
]

export const DEFAULT_DOCUMENT_TAGS = [
  'relance',
  'vip',
  'comptabilité',
  'e-commerce',
  'urgent',
] as const

export function isDocumentFolder(value: string | undefined): value is DocumentFolder {
  return !!value && (DOCUMENT_FOLDERS as string[]).includes(value)
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
