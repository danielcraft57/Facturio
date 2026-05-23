import type { SxProps, Theme } from '@mui/material/styles'
import {
  Box,
  Card,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import type { Quote } from '../../../types/quote'
import type { DocumentFlags } from '../../../types/documentFolders'
import { DocumentFolderRowActions } from '../../../components/finance/DocumentFolderRowActions'
import { documentFolderUnreadRowSx } from '../../../components/finance/documentFolderStyles'
import { getRealtimeRowSx } from '../../../utils/realtimeRowHighlight'
import type { RealtimeHighlightTone } from '../../../types/realtime'
import { QuoteRowActionsMenu } from './QuoteRowActionsMenu'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Rejeté',
  EXPIRED: 'Expiré',
}

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  DRAFT: 'default',
  SENT: 'primary',
  ACCEPTED: 'success',
  REJECTED: 'error',
  EXPIRED: 'warning',
}

type QuoteFolderMobileListProps = {
  quotes: Quote[]
  highlightRows: Record<string, RealtimeHighlightTone>
  formatCurrency: (n: number) => string
  formatDate: (d: string) => string
  onPatchFlags: (id: string, patch: DocumentFlags) => void
  onEdit: (q: Quote) => void
  onSend: (q: Quote) => void
  onAccept: (q: Quote) => void
  onReject: (q: Quote) => void
  onConvert: (q: Quote) => void
  onArchive: (q: Quote) => void
}

export function QuoteFolderMobileList({
  quotes,
  highlightRows,
  formatCurrency,
  formatDate,
  onPatchFlags,
  onEdit,
  onSend,
  onAccept,
  onReject,
  onConvert,
  onArchive,
}: QuoteFolderMobileListProps) {
  return (
    <Stack spacing={1}>
      {quotes.map((quote) => {
        const rowHighlight = highlightRows[String(quote.id)]
        return (
          <Card
            key={quote.id}
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
                !quote.seenAt ? documentFolderUnreadRowSx : {},
              ] as SxProps<Theme>
            }
          >
            <Box sx={{ px: 1.5, py: 1.25 }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <DocumentFolderRowActions
                  starred={!!quote.starred}
                  important={!!quote.important}
                  compact
                  onUpdate={(patch) => onPatchFlags(quote.id, patch)}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" fontWeight={quote.seenAt ? 600 : 800} noWrap>
                        {quote.number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {quote.client?.name ?? `Client #${quote.clientId}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(quote.date)}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
                      <Chip
                        label={STATUS_LABELS[quote.status] ?? quote.status}
                        color={STATUS_COLORS[quote.status] ?? 'default'}
                        size="small"
                        sx={{ fontWeight: 600, height: 22, fontSize: '0.7rem' }}
                      />
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(quote.total)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </Box>
            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              sx={{ px: 1, pb: 1, pt: 0 }}
            >
              <QuoteRowActionsMenu
                quote={quote}
                onEdit={() => onEdit(quote)}
                onSend={() => onSend(quote)}
                onAccept={() => onAccept(quote)}
                onReject={() => onReject(quote)}
                onConvert={() => onConvert(quote)}
                onArchive={() => onArchive(quote)}
              />
            </Stack>
          </Card>
        )
      })}
    </Stack>
  )
}
