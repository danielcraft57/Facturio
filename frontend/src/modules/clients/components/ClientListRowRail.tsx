import type { ReactNode } from 'react'
import type { SxProps, Theme } from '@mui/material/styles'
import type { Client } from '../../../services/clients'
import {
  DocumentFolderRowRail,
  getDocumentFolderRailRowAccentSx,
} from '../../../components/finance/DocumentFolderRowRail'
import {
  getClientFolderRowHoverSx,
  getClientFolderRowRevealSx,
} from '../clientFolderRowEffects'
import { resolveClientRailVisual } from '../clientRowRailVisual'

type Layout = 'table' | 'card'

export type ClientListRowRailParts = {
  accent: string
  rowSx: SxProps<Theme>
  rail: ReactNode
}

/** Rail statut client (lecture seule, sans suivi/tags). */
export function buildClientListRowRail(
  client: Client,
  layout: Layout = 'table',
  index = 0,
): ClientListRowRailParts {
  const visual = resolveClientRailVisual(client)
  const rowSx: SxProps<Theme> = [
    layout === 'table' ? getDocumentFolderRailRowAccentSx(visual) : {},
    getClientFolderRowHoverSx(visual.accent),
    getClientFolderRowRevealSx(index),
  ]
  return {
    accent: visual.accent,
    rowSx,
    rail: (
      <DocumentFolderRowRail
        layout={layout}
        visual={visual}
        starred={false}
        important={false}
        showImportant={false}
        showTags={false}
        showActions={false}
        unread={false}
        onUpdate={() => {}}
      />
    ),
  }
}
