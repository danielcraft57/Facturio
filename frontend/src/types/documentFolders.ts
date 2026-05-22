/** Dossiers de classement pour factures / devis émis. */
export type DocumentFolder =
  | 'inbox'
  | 'nouveau'
  | 'suivi'
  | 'attente'
  | 'important'
  | 'envoyes'
  | 'brouillons'

export type DocumentFolderCounts = Record<DocumentFolder, number>

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
