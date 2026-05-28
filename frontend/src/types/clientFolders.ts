import type { ClientFolder } from '../services/clients'

export type { ClientFolder, ClientFolderCounts } from '../services/clients'

export const CLIENT_FOLDER_LABELS: Record<ClientFolder, string> = {
  inbox: 'Tous',
  actifs: 'Actifs',
  inactifs: 'Inactifs',
  prospects: 'Prospects',
  entreprises: 'Entreprises',
  particuliers: 'Particuliers',
}

export const CLIENT_FOLDERS: ClientFolder[] = [
  'inbox',
  'actifs',
  'inactifs',
  'prospects',
  'entreprises',
  'particuliers',
]

export function isClientFolder(value: string | undefined): value is ClientFolder {
  return !!value && (CLIENT_FOLDERS as string[]).includes(value)
}

/** Segment URL `/clients/:segment` qui pointe vers une fiche client (id public 10 car.). */
export function isClientDetailRouteSegment(value: string | undefined): boolean {
  if (!value || isClientFolder(value)) return false
  return /^[0-9a-z]{10}$/i.test(value)
}

export const clientFolderPageSubtitle = () =>
  'Carnet clients — recherche par nom, email, statut ou SIREN'
