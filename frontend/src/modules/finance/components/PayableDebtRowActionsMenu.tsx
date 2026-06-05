import { useState } from 'react'
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import VisibilityIcon from '@mui/icons-material/Visibility'
import SendIcon from '@mui/icons-material/Send'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import ContentCopy from '@mui/icons-material/ContentCopy'
import Payments from '@mui/icons-material/Payments'
import CancelIcon from '@mui/icons-material/Cancel'
import ArchiveIcon from '@mui/icons-material/Archive'
import type { PayableDebtRow } from '../../../services/payables'
import { canCancelPayableDebt, canRecordPayablePayment } from '../payableDebtPaymentValidation'

export type PayableDebtRowActionsHandlers = {
  busy?: boolean
  onView: () => void
  onSend: () => void
  onCopyLink: () => void
  onRecordPayment: () => void
  onCancelDebt?: () => void
  onArchive?: () => void
}

type Props = PayableDebtRowActionsHandlers & {
  debt: PayableDebtRow
}

function wasPayableDebtEmailed(debt: PayableDebtRow): boolean {
  const eng = debt.emailEngagement
  return Boolean(eng?.emailSent ?? eng?.sentAt)
}

export function PayableDebtRowActionsMenu({
  debt,
  busy = false,
  onView,
  onSend,
  onCopyLink,
  onRecordPayment,
  onCancelDebt,
  onArchive,
}: Props) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const close = () => setAnchor(null)
  const emailed = wasPayableDebtEmailed(debt)

  return (
    <>
      <IconButton
        size="small"
        disabled={busy}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label="Actions"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem
          onClick={() => {
            close()
            onView()
          }}
          disabled={busy}
        >
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Voir</ListItemText>
        </MenuItem>
        {debt.status !== 'CANCELLED' && (
          <MenuItem
            onClick={() => {
              close()
              onSend()
            }}
            disabled={busy}
          >
            <ListItemIcon>
              {emailed ? (
                <MarkEmailReadIcon fontSize="small" color="success" />
              ) : (
                <SendIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>{emailed ? 'Renvoyer' : 'Envoyer'}</ListItemText>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            close()
            onCopyLink()
          }}
          disabled={busy}
        >
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copier le lien</ListItemText>
        </MenuItem>
        {canRecordPayablePayment(debt.status, debt.balance) && (
          <MenuItem
            onClick={() => {
              close()
              onRecordPayment()
            }}
            disabled={busy}
          >
            <ListItemIcon>
              <Payments fontSize="small" />
            </ListItemIcon>
            <ListItemText>Régler</ListItemText>
          </MenuItem>
        )}
        {onArchive && (
          <MenuItem
            onClick={() => {
              close()
              onArchive()
            }}
            disabled={busy}
          >
            <ListItemIcon>
              <ArchiveIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Archiver</ListItemText>
          </MenuItem>
        )}
        {canCancelPayableDebt(debt.status) && onCancelDebt && (
          <MenuItem
            onClick={() => {
              close()
              onCancelDebt()
            }}
            disabled={busy}
          >
            <ListItemIcon>
              <CancelIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Annuler la dette</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  )
}
