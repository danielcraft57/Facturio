import type { DocumentFolder, DocumentFolderCounts } from '../types/documentFolders'

/** Ajuste les compteurs après archivage depuis un dossier actif. */
export function folderCountsAfterArchive(
  folder: DocumentFolder,
  count: number,
): Partial<DocumentFolderCounts> {
  if (count <= 0) return {}
  return {
    [folder]: -count,
    archives: count,
  }
}

/** Ajuste les compteurs après ajout d’un document dans l’inbox. */
export function folderCountsAfterInboxCreate(
  unseen: boolean,
): Partial<DocumentFolderCounts> {
  return {
    inbox: 1,
    ...(unseen ? { nouveau: 1 } : {}),
  }
}
