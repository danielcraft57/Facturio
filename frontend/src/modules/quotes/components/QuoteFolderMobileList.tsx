import type { SxProps, Theme } from '@mui/material/styles'
import { Box, Card, Chip, Stack, Typography } from '@mui/material'
import type { Quote } from '../../../types/quote'
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
import type { useDocumentFolderSelection } from '../../../hooks/useDocumentFolderSelection'

type SelectionApi = ReturnType<typeof useDocumentFolderSelection<Quote>>
import { getRealtimeRowSx } from '../../../utils/realtimeRowHighlight'
import type { RealtimeHighlightTone } from '../../../types/realtime'
import { QuoteRowActionsMenu } from './QuoteRowActionsMenu'
import { resolveQuoteDisplayStatus } from '../quoteDisplayStatus'

type QuoteFolderMobileListProps = {
  quotes: Quote[]
  highlightRows: Record<string, RealtimeHighlightTone>
  formatCurrency: (n: number) => string
  formatDate: (d: string) => string
  onPatchFlags: (id: string, patch: DocumentFlags) => void
  onEdit: (q: Quote) => void
  onSend: (q: Quote) => void
  onConvert: (q: Quote) => void
  onRemindDeposit?: (q: Quote) => void
  onArchive: (q: Quote) => void
  selection?: SelectionApi
  savedTags?: string[]
  onRememberTag?: (tag: string) => void | Promise<void>
  onRemoveSavedTag?: (tag: string) => void | Promise<void>
}

export function QuoteFolderMobileList({
  quotes,
  highlightRows,
  formatCurrency,
  formatDate,
  onPatchFlags,
  onEdit,
  onSend,
  onConvert,
  onRemindDeposit,
  onArchive,
  selection,
  savedTags = [],
  onRememberTag,
  onRemoveSavedTag,
}: QuoteFolderMobileListProps) {
  return (
    <Stack spacing={1} sx={documentFolderMobileListSx}>
      {quotes.map((quote) => {
        const rowHighlight = highlightRows[String(quote.id)]
        const quoteId = String(quote.id)
        const selected = selection?.isSelected(quoteId) ?? false
        return (
          <Card
            key={quote.id}
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
                !quote.seenAt ? documentFolderUnreadRowSx : {},
                selection
                  ? documentFolderBulkRowSx(selected, selection.selectionActive)
                  : {},
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
                    onToggle={() => selection.toggle(quoteId)}
                    inputProps={{ 'aria-label': `Sélectionner ${quote.number}` }}
                  />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
            <DocumentFolderListRowRail
              kind="quote"
              layout="card"
              item={quote}
              onUpdate={(patch) => onPatchFlags(quote.id, patch)}
              tagsSlot={{
                tags: quote.tags ?? [],
                onChange: (tags) => onPatchFlags(quote.id, { tags }),
                savedTags,
                onRememberTag,
                onRemoveSavedTag,
              }}
            />
              </Box>
            </Stack>
            <Box sx={{ px: 1.5, py: 1.25 }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
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
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {quote.client?.email ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(quote.date)}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
                      {(() => {
                        const display = resolveQuoteDisplayStatus(quote)
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
                onConvert={() => onConvert(quote)}
                onRemindDeposit={onRemindDeposit ? () => onRemindDeposit(quote) : undefined}
                onArchive={() => onArchive(quote)}
              />
            </Stack>
          </Card>
        )
      })}
    </Stack>
  )
}
