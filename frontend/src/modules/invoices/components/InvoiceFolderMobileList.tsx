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
import { documentFolderUnreadRowSx } from '../../../components/finance/documentFolderStyles'
import { getRealtimeRowSx } from '../../../utils/realtimeRowHighlight'
import type { RealtimeHighlightTone } from '../../../types/realtime'
import { InvoiceRowActionsMenu } from './InvoiceRowActionsMenu'

type InvoiceFolderMobileListProps = {
  invoices: Invoice[]
  highlightRows: Record<string, RealtimeHighlightTone>
  actionLoadingId: string | null
  formatCurrency: (n: number) => string
  getStatusLabel: (s: string) => string
  getStatusColor: (s: string) => string
  canRemind: (status: Invoice['status']) => boolean
  onPatchFlags: (id: string, patch: DocumentFlags) => void
  onNavigate: (id: string) => void
  onEditNavigate?: (id: string) => void
  onSend: (invoice: Invoice) => void
  onRemind: (invoice: Invoice) => void
  onArchive: (invoice: Invoice) => void
  onDownload: (invoice: Invoice) => void
}

export function InvoiceFolderMobileList({
  invoices,
  highlightRows,
  actionLoadingId,
  formatCurrency,
  getStatusLabel,
  getStatusColor,
  canRemind,
  onPatchFlags,
  onNavigate,
  onEditNavigate,
  onSend,
  onRemind,
  onArchive,
  onDownload,
}: InvoiceFolderMobileListProps) {
  return (
    <Stack spacing={1}>
      {invoices.map((invoice) => {
        const busy = actionLoadingId === invoice.id
        const rowHighlight = highlightRows[invoice.id]
        const canSend =
          invoice.status === 'draft' ||
          invoice.status === 'sent' ||
          invoice.status === 'overdue' ||
          invoice.status === 'paid'

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
              ] as SxProps<Theme>
            }
          >
            <CardActionArea onClick={() => onNavigate(invoice.id)} sx={{ alignItems: 'stretch' }}>
              <Box sx={{ px: 1.5, py: 1.25 }}>
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
                        <Chip
                          label={getStatusLabel(invoice.status)}
                          color={
                            getStatusColor(invoice.status) as
                              | 'success'
                              | 'info'
                              | 'error'
                              | 'warning'
                              | 'default'
                          }
                          size="small"
                          sx={{ fontWeight: 600, height: 22, fontSize: '0.7rem' }}
                        />
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
          </Card>
        )
      })}
    </Stack>
  )
}
