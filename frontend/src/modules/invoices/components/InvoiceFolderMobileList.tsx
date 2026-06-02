import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import type { Invoice } from '../../../services/invoices'
import type { DocumentFlags } from '../../../types/documentFolders'
import { DocumentFolderRowActions } from '../../../components/finance/DocumentFolderRowActions'
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
              ] as SxProps<Theme>
            }
          >
            <Stack direction="row" alignItems="stretch">
              {selection && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    pt: 1.1,
                    pl: 0.5,
                  }}
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
                <CardActionArea onClick={() => onNavigate(invoice.id)} sx={{ alignItems: 'stretch' }}>
                  <Box sx={{ px: 1.5, py: 1.25, pl: selection ? 0.5 : 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <DocumentFolderRowActions
                        starred={!!invoice.starred}
                        important={!!invoice.important}
                        compact
                        onUpdate={(patch) => onPatchFlags(invoice.id, patch)}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          spacing={1}
                        >
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" fontWeight={invoice.seenAt ? 600 : 800} noWrap>
                              {invoice.number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                              {invoice.client.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                            </Typography>
                          </Box>
                          <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
                            {(() => {
                              const display = resolveInvoiceDisplayStatus(invoice)
                              return (
                                <Chip
                                  label={display.label}
                                  color={display.color}
                                  size="small"
                                  sx={{ fontWeight: 600, height: 22, fontSize: '0.7rem' }}
                                />
                              )
                            })()}
                            <Typography variant="body2" fontWeight={700}>
                              {formatCurrency(invoice.total)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
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
              </Box>
            </Stack>
          </Card>
        )
      })}
    </Stack>
  )
}
