import type { DocumentFolder, DocumentStatusFolder } from '../types/documentFolders'
import type { FolderNavConfig, FolderNavGroup } from '../types/folderNav'

export type DocumentFolderResource = 'factures' | 'devis' | 'dettes'

const QUOTE_STATUS_FOLDERS: DocumentStatusFolder[] = [
  'status_draft',
  'status_sent',
  'status_viewed',
  'status_clicked',
  'status_accepted',
  'status_rejected',
  'status_expired',
]

const INVOICE_STATUS_FOLDERS: DocumentStatusFolder[] = [
  'status_draft',
  'status_sent',
  'status_viewed',
  'status_clicked',
  'status_overdue',
  'status_paid',
  'status_cancelled',
]

const PAYABLE_STATUS_FOLDERS: DocumentStatusFolder[] = [
  'status_draft',
  'status_sent',
  'status_viewed',
  'status_clicked',
  'status_partial',
  'status_paid',
  'status_cancelled',
]

/** Toujours visibles en tête du menu. */
const PRIMARY_FOLDERS: DocumentFolder[] = ['inbox', 'nouveau']

/** Suivi, reportés, etc. — replié par défaut. */
const CLASSEMENT_GROUP: FolderNavGroup<DocumentFolder> = {
  id: 'classement',
  label: 'Classement',
  folders: ['suivi', 'attente', 'important', 'envoyes', 'brouillons'],
  collapsible: true,
  defaultCollapsed: true,
}

function statusGroup(folders: DocumentStatusFolder[]): FolderNavGroup<DocumentFolder> {
  return {
    id: 'statut',
    label: 'Statut',
    folders,
    collapsible: true,
    defaultCollapsed: false,
  }
}

const NAV_BY_RESOURCE: Record<DocumentFolderResource, FolderNavConfig<DocumentFolder>> = {
  devis: {
    primaryFolders: PRIMARY_FOLDERS,
    groups: [statusGroup(QUOTE_STATUS_FOLDERS), CLASSEMENT_GROUP],
  },
  factures: {
    primaryFolders: PRIMARY_FOLDERS,
    groups: [statusGroup(INVOICE_STATUS_FOLDERS), CLASSEMENT_GROUP],
  },
  dettes: {
    primaryFolders: PRIMARY_FOLDERS,
    groups: [
      statusGroup(PAYABLE_STATUS_FOLDERS),
      {
        ...CLASSEMENT_GROUP,
        folders: CLASSEMENT_GROUP.folders.filter((f) => f !== 'important'),
      },
    ],
  },
}

/** Menu latéral paramétrable par module (groupes + exclusions). */
export function getDocumentFolderNav(
  resource: DocumentFolderResource,
  excludeFolders: DocumentFolder[] = [],
): FolderNavConfig<DocumentFolder> {
  const exclude = new Set(excludeFolders)
  const config = NAV_BY_RESOURCE[resource]
  return {
    primaryFolders: config.primaryFolders?.filter((f) => !exclude.has(f)),
    groups: config.groups.map((group) => ({
      ...group,
      folders: group.folders.filter((f) => !exclude.has(f)),
    })),
  }
}
