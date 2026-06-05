import type { SxProps, Theme } from '@mui/material/styles'
import type { DocumentFolderRowMotionLayout } from '../../../components/finance/documentFolderRailMotion'
import { Box, Card, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { PayableDebtRow } from '../../../services/payables'
import type { DocumentFlags } from '../../../types/documentFolders'
import {
  DocumentFolderListRowRail,
  documentFolderTableRowClass,
} from '../../../components/finance/DocumentFolderListRowRail'
import { DocumentFolderRowCheckbox } from '../../../components/finance/DocumentFolderRowCheckbox'
import {
  documentFolderBulkRowSx,
  documentFolderMobileListSx,
} from '../../../components/finance/documentFolderStyles'
import { getRealtimeRowSx } from '../../../utils/realtimeRowHighlight'
import type { useDocumentFolderSelection } from '../../../hooks/useDocumentFolderSelection'

import type { RealtimeHighlightTone } from '../../../types/realtime'

type SelectionApi = ReturnType<typeof useDocumentFolderSelection<PayableDebtRow>>
import { PayableDebtRowActionsMenu } from './PayableDebtRowActionsMenu'
import { resolvePayableDebtDisplayStatus } from '../payableDebtDisplayStatus'
import { DocumentFolderStatusChip } from '../../../components/finance/DocumentFolderStatusChip'
import { formatCurrency } from '../../../utils/formatters'

type Props = {
  debts: PayableDebtRow[]
  highlightRows: Record<string, RealtimeHighlightTone>
  onPatchFlags: (id: number, patch: DocumentFlags) => void
  onView: (d: PayableDebtRow) => void
  onSend: (d: PayableDebtRow) => void
  onCopyLink: (d: PayableDebtRow) => void
  onRecordPayment: (d: PayableDebtRow) => void
  onArchive: (d: PayableDebtRow) => void
  selection?: SelectionApi
  onCancelDebt?: (d: PayableDebtRow) => void
  savedTags?: string[]
  onRememberTag?: (tag: string) => void | Promise<void>
  onRemoveSavedTag?: (tag: string) => void | Promise<void>
  getRowMotionSx?: (id: string, layout?: DocumentFolderRowMotionLayout) => SxProps<Theme>
}

export function PayableDebtFolderMobileList({
  debts,
  highlightRows,
  onPatchFlags,
  onView,
  onSend,
  onCopyLink,
  onRecordPayment,
  onArchive,
  selection,
  onCancelDebt,
  savedTags = [],
  onRememberTag,
  onRemoveSavedTag,
  getRowMotionSx,
}: Props) {
  return (
    <Stack spacing={1} sx={documentFolderMobileListSx}>
      {debts.map((debt) => {
        const display = resolvePayableDebtDisplayStatus(debt)
        const rowHighlight = highlightRows[String(debt.id)]
        const selected = selection?.isSelected(debt.id) ?? false
        return (
          <Card
            key={debt.id}
            variant="outlined"
            className={documentFolderTableRowClass}
            sx={
              [
                { borderRadius: 2, border: 1, borderColor: 'divider', overflow: 'hidden' },
                getRealtimeRowSx(rowHighlight),
                selection
                  ? documentFolderBulkRowSx(selected, selection.selectionActive)
                  : {},
                getRowMotionSx?.(String(debt.id), 'card') ?? {},
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
                    onToggle={() => selection.toggle(debt.id)}
                    inputProps={{ 'aria-label': `Sélectionner ${debt.label}` }}
                  />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
            <DocumentFolderListRowRail
              kind="payable_debt"
              layout="card"
              item={debt}
              onUpdate={(patch) => onPatchFlags(debt.id, patch)}
              tagsSlot={{
                tags: debt.tags ?? [],
                onChange: (tags) => onPatchFlags(debt.id, { tags }),
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
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        component={RouterLink}
                        to={`/dettes/voir/${debt.id}`}
                        variant="body2"
                        fontWeight={debt.seenAt ? 600 : 800}
                        noWrap
                        sx={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {debt.creditorName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {debt.creditorEmail ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        {debt.label}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
                      <DocumentFolderStatusChip
                        label={display.label}
                        color={display.color}
                        chipSx={{ height: 22, fontSize: '0.7rem' }}
                      />
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(debt.balance)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
                <PayableDebtRowActionsMenu
                  debt={debt}
                  onView={() => onView(debt)}
                  onSend={() => onSend(debt)}
                  onCopyLink={() => onCopyLink(debt)}
                  onRecordPayment={() => onRecordPayment(debt)}
                  onArchive={() => onArchive(debt)}
                  onCancelDebt={onCancelDebt ? () => onCancelDebt(debt) : undefined}
                />
              </Stack>
            </Box>
          </Card>
        )
      })}
    </Stack>
  )
}
