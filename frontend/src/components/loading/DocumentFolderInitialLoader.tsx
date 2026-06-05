import { DocumentFolderContentSkeleton } from './DocumentFolderContentSkeleton'
import { WorkspacePreparationDialog } from './WorkspacePreparationDialog'
import type { WorkspacePreparationResource } from './workspacePreparationConfig'

type DocumentFolderInitialLoaderProps = {
  resource: WorkspacePreparationResource
  rows?: number
  variant?: 'table' | 'cards'
}

/** Premier chargement d’une page dossiers : popin + squelette sous-jacent. */
export function DocumentFolderInitialLoader({
  resource,
  rows = 8,
  variant = 'table',
}: DocumentFolderInitialLoaderProps) {
  return (
    <>
      <WorkspacePreparationDialog open resource={resource} />
      <DocumentFolderContentSkeleton rows={rows} variant={variant} />
    </>
  )
}
