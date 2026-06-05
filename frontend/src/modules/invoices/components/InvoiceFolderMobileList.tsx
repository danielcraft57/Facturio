import {
  Box,
  Card,
  CardActionArea,
  Stack,
  Typography,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import type { DocumentFolderRowMotionLayout } from '../../../components/finance/documentFolderRailMotion'
import type { Invoice } from '../../../services/invoices'
import type { DocumentFlags } from '../../../types/documentFolders'
import {
  DocumentFolderListRowRail,
  documentFolderTableRowClass,
} from '../../../components/finance/DocumentFolderListRowRail'
import { DocumentFolderRowCheckbox } from '../../../components/finance/DocumentFolderRowCheckbox'
import {
  documentFolderUnreadRowSx,
  documentFolderBulkRowSx,
  documentFolderMobileListSx,
} from '../../../components/finance/documentFolderStyles'
import { getRealtimeRowSx } from '../../../utils/realtimeRowHighlight'
import type { RealtimeHighlightTone } from '../../../types/realtime'
import { InvoiceRowActionsMenu } from './InvoiceRowActionsMenu'
import { resolveInvoiceDisplayStatus } from '../invoiceDisplayStatus'
import { DocumentFolderStatusChip } from '../../../components/finance/DocumentFolderStatusChip'
import type { useDocumentFolderSelection } from '../../../hooks/useDocumentFolderSelection'

type SelectionApi = ReturnType<typeof useDocumentFolderSelection<Invoice>>

type InvoiceFolderMobileListProps = {
  invoices: Invoice[]
  highlightRows: Record<string, RealtimeHighlightTone>
  actionLoadingId: string | null
  formatCurrency: (n: number) => string
  canRemind: (status: Invoice['status']) => boolean
  onPatchFlags: (id: string, patch: DocumentFlags) => void
  onNavigate: (id: string) => void
  onEditNavigate?: (id: string) => void
  onSend: (invoice: Invoice) => void
  onRemind: (invoice: Invoice) => void
  onArchive: (invoice: Invoice) => void
  onDownload: (invoice: Invoice) => void
  selection?: SelectionApi
  savedTags?: string[]
  onRememberTag?: (tag: string) => void | Promise<void>
  onRemoveSavedTag?: (tag: string) => void | Promise<void>
  getRowMotionSx?: (id: string, layout?: DocumentFolderRowMotionLayout) => SxProps<Theme>
}

export function InvoiceFolderMobileList({
  invoices,
  highlightRows,
  actionLoadingId,
  formatCurrency,
  canRemind,
  onPatchFlags,
  onNavigate,
  onEditNavigate,
  onSend,
  onRemind,
  onArchive,
  onDownload,
  selection,
  savedTags = [],
  onRememberTag,
  onRemoveSavedTag,
  getRowMotionSx,
}: InvoiceFolderMobileListProps) {
  return (
    <Stack spacing={1} sx={documentFolderMobileListSx}>
      {invoices.map((invoice) => {
        const busy = actionLoadingId === invoice.id
        const rowHighlight = highlightRows[invoice.id]
        const canSend =
          invoice.status === 'draft' ||
          invoice.status === 'sent' ||
          invoice.status === 'overdue' ||
          invoice.status === 'paid'
        const selected = selection?.isSelected(invoice.id) ?? false

        return (
          <Card
            key={invoice.id}
            variant="outlined"
            className={documentFolderTableRowClass}
            sx={
              [
                {
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'divider',
                  overflow: 'hidden',
                },
                getRealtimeRowSx(rowHighlight),
                !invoice.seenAt ? documentFolderUnreadRowSx : {},
                selection
                  ? documentFolderBulkRowSx(selected, selection.selectionActive)
                  : {},
                getRowMotionSx?.(invoice.id, 'card') ?? {},
              ] as SxProps<Theme>
            }
          >
            <Stack direction="row" alignItems="stretch">
              {selection && (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0, m: 0, width: 32 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <DocumentFolderRowCheckbox
                    checked={selected}
                    visible={selection.selectionActive}
                    onToggle={() => selection.toggle(invoice.id)}
                    inputProps={{ 'aria-label': `Sélectionner ${invoice.number}` }}
                  />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
            <DocumentFolderListRowRail
              kind="invoice"
              layout="card"
              item={invoice}
              onUpdate={(patch) => onPatchFlags(invoice.id, patch)}
              tagsSlot={{
                tags: invoice.tags ?? [],
                onChange: (tags) => onPatchFlags(invoice.id, { tags }),
                savedTags,
                onRememberTag,
                onRemoveSavedTag,
              }}
            />
            <Stack direction="row" alignItems="stretch">
              <CardActionArea
                onClick={() => onNavigate(invoice.id)}
                sx={{ flex: 1, minWidth: 0, alignItems: 'stretch' }}
              >
                <Stack sx={{ px: 1.5, py: 1.25 }} spacing={0.5}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Stack sx={{ minWidth: 0, flex: 1 }} spacing={0.25}>
                      <Typography variant="body2" fontWeight={invoice.seenAt ? 600 : 800} noWrap>
                        {invoice.number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {invoice.client.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {invoice.client.email || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Stack>
                    <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
                      {(() => {
                        const display = resolveInvoiceDisplayStatus(invoice)
                        return (
                          <DocumentFolderStatusChip
                            label={display.label}
                            color={display.color}
                            chipSx={{ height: 22, fontSize: '0.7rem' }}
                          />
                        )
                      })()}
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(invoice.total)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </CardActionArea>
              <Stack
                direction="row"
                justifyContent="flex-end"
                alignItems="center"
                sx={{ px: 1, pb: 1, pt: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <InvoiceRowActionsMenu
                  invoice={invoice}
                  busy={busy}
                  canSend={canSend}
                  canRemind={canRemind(invoice.status)}
                  onView={() => onNavigate(invoice.id)}
                  onEdit={() => (onEditNavigate ?? onNavigate)(invoice.id)}
                  onSend={() => onSend(invoice)}
                  onRemind={() => onRemind(invoice)}
                  onArchive={() => onArchive(invoice)}
                  onDownload={() => onDownload(invoice)}
                />
              </Stack>
            </Stack>
              </Box>
            </Stack>
          </Card>
        )
      })}
    </Stack>
  )
}
