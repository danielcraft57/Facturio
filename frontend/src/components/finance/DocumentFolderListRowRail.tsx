import type { ReactNode } from 'react'
import type { DocumentFlags } from '../../types/documentFolders'
import type { Invoice } from '../../services/invoices'
import type { PayableDebtRow } from '../../services/payables'
import type { Quote } from '../../types/quote'
import type { SxProps, Theme } from '@mui/material/styles'
import {
  DocumentFolderRowRail,
  getDocumentFolderRailRowAccentSx,
  type DocumentFolderRailTagsProps,
} from './DocumentFolderRowRail'
import type { DocumentFolderRailVisual } from './documentFolderRowRailVisual'
import {
  resolveInvoiceRailVisual,
  resolvePayableDebtRailVisual,
  resolveQuoteRailVisual,
} from './documentFolderRowRailVisual'

export type {
  DocumentFolderRailTagsProps,
  DocumentFolderRailBulkHeaderProps,
} from './DocumentFolderRowRail'

export {
  documentFolderRailCellClass,
  documentFolderTableRowClass,
  documentFolderStatusRailZoneClass,
  DocumentFolderRailTableHeaderCell,
  getDocumentFolderRailHeaderCellSx,
  getDocumentFolderRailHeaderRowSx,
  getDocumentFolderRailRowAccentSx,
  getDocumentFolderRailTableCellSx,
} from './DocumentFolderRowRail'

export {
  DocumentFolderBulkTableHeaderCell,
  DocumentFolderBulkTableBodyCell,
} from './DocumentFolderBulkCells'

export { buildDocumentFolderRailBulkSlot } from './documentFolderRailBulk'

type RailLayout = 'table' | 'card'

type BaseProps = {
  onUpdate: (patch: DocumentFlags) => void | Promise<void>
  layout?: RailLayout
  tagsSlot?: DocumentFolderRailTagsProps
}

export type DocumentFolderListRowRailProps = BaseProps &
  (
    | { kind: 'invoice'; item: Invoice }
    | { kind: 'quote'; item: Quote }
    | { kind: 'payable_debt'; item: PayableDebtRow }
  )

function resolveListRowRailVisual(props: DocumentFolderListRowRailProps): DocumentFolderRailVisual {
  if (props.kind === 'invoice') return resolveInvoiceRailVisual(props.item)
  if (props.kind === 'quote') return resolveQuoteRailVisual(props.item)
  return resolvePayableDebtRailVisual(props.item)
}

export type DocumentFolderListRowRailParts = {
  visual: DocumentFolderRailVisual
  rowAccentSx: SxProps<Theme>
  rail: ReactNode
}

/** Rail + `borderLeft` de ligne pour tableaux (barre collée au bord). */
export function buildDocumentFolderListRowRail(
  props: DocumentFolderListRowRailProps,
): DocumentFolderListRowRailParts {
  const { onUpdate, layout = 'table', tagsSlot } = props
  const item = props.item
  const visual = resolveListRowRailVisual(props)
  return {
    visual,
    rowAccentSx: layout === 'table' ? getDocumentFolderRailRowAccentSx(visual) : {},
    rail: (
      <DocumentFolderRowRail
        layout={layout}
        visual={visual}
        starred={!!item.starred}
        important={!!item.important}
        showImportant
        showTags
        unread={!item.seenAt}
        onUpdate={onUpdate}
        tagsSlot={tagsSlot}
      />
    ),
  }
}

/**
 * Rail de liste unifié (devis, factures, dettes) : statut + actions + tags au survol.
 */
export function DocumentFolderListRowRail(props: DocumentFolderListRowRailProps) {
  return buildDocumentFolderListRowRail(props).rail
}
