import { useState } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Divider,
} from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SendIcon from '@mui/icons-material/Send'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import ReceiptIcon from '@mui/icons-material/Receipt'
import ArchiveIcon from '@mui/icons-material/Archive'
import EditIcon from '@mui/icons-material/Edit'
import ReplayIcon from '@mui/icons-material/Replay'
import VisibilityIcon from '@mui/icons-material/Visibility'
import type { Quote } from '../../../types/quote'

export type QuoteRowActionsHandlers = {
  busy?: boolean
  onEdit?: () => void
  onSend: () => void
  onConvert: () => void
  onArchive: () => void
  onRemindDeposit?: () => void
}

type QuoteRowActionsMenuProps = QuoteRowActionsHandlers & {
  quote: Quote
  /** Boutons en ligne (desktop large). */
  expanded?: boolean
}

function wasQuoteEmailed(quote: Quote): boolean {
  const eng = quote.emailEngagement
  return Boolean(eng?.emailSent ?? quote.emailSent)
}

export function QuoteRowActionsMenu({
  quote,
  busy = false,
  expanded = false,
  onEdit,
  onSend,
  onConvert,
  onArchive,
  onRemindDeposit,
}: QuoteRowActionsMenuProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const close = () => setAnchor(null)
  const emailed = wasQuoteEmailed(quote)

  const openInvoiceOrConvert = () => {
    if (quote.invoiceId) {
      void import('../../../utils/openDocumentView').then(({ openInvoiceView }) =>
        openInvoiceView(quote.invoiceId!),
      )
      return
    }
    onConvert()
  }

  const menuItems = [
    <MenuItem
      key="view"
      onClick={() => {
        close()
        void import('../../../utils/openDocumentView').then(({ openQuoteView }) => openQuoteView(quote.id))
      }}
      disabled={busy}
    >
      <ListItemIcon>
        <VisibilityIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Voir</ListItemText>
    </MenuItem>,
    ...(quote.status === 'DRAFT' || quote.status === 'SENT'
      ? [
          <MenuItem key="edit" onClick={() => { close(); onEdit?.() }} disabled={busy || !onEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Modifier</ListItemText>
          </MenuItem>,
        ]
      : []),
    ...(quote.status === 'DRAFT'
      ? [
          <MenuItem key="send" onClick={() => { close(); onSend() }} disabled={busy}>
            <ListItemIcon>
              <SendIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Envoyer</ListItemText>
          </MenuItem>,
        ]
      : []),
    ...(quote.status === 'SENT'
      ? [
          <MenuItem key="resend" onClick={() => { close(); onSend() }} disabled={busy}>
            <ListItemIcon>
              {emailed ? (
                <MarkEmailReadIcon fontSize="small" color="success" />
              ) : (
                <SendIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>{emailed ? 'Renvoyer' : 'Envoyer'}</ListItemText>
          </MenuItem>,
        ]
      : []),
    ...(quote.status === 'ACCEPTED'
      ? [
          <MenuItem key="convert" onClick={() => { close(); openInvoiceOrConvert() }} disabled={busy}>
            <ListItemIcon>
              <ReceiptIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Voir facture</ListItemText>
          </MenuItem>,
          ...(onRemindDeposit
            ? [
                <MenuItem
                  key="remindDeposit"
                  onClick={() => {
                    close()
                    onRemindDeposit()
                  }}
                  disabled={busy}
                >
                  <ListItemIcon>
                    <ReplayIcon fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText>Relancer acompte</ListItemText>
                </MenuItem>,
              ]
            : []),
        ]
      : []),
    <Divider key="divider" />,
    <MenuItem key="archive" onClick={() => { close(); onArchive() }} disabled={busy}>
      <ListItemIcon>
        <ArchiveIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Archiver</ListItemText>
    </MenuItem>,
  ]

  if (expanded) {
    return (
      <Stack direction="row" spacing={0.25} justifyContent="center" flexWrap="nowrap">
        <IconButton
          size="small"
          title="Voir"
          disabled={busy}
          onClick={() => {
            void import('../../../utils/openDocumentView').then(({ openQuoteView }) =>
              openQuoteView(quote.id),
            )
          }}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
        {(quote.status === 'DRAFT' || quote.status === 'SENT') && onEdit && (
          <IconButton size="small" title="Modifier" disabled={busy} onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        {quote.status === 'DRAFT' && (
          <IconButton size="small" title="Envoyer" disabled={busy} onClick={onSend}>
            <SendIcon fontSize="small" />
          </IconButton>
        )}
        {quote.status === 'SENT' && (
          <IconButton
            size="small"
            title={emailed ? 'Renvoyer' : 'Envoyer'}
            disabled={busy}
            onClick={onSend}
          >
            {emailed ? (
              <MarkEmailReadIcon fontSize="small" color="success" />
            ) : (
              <SendIcon fontSize="small" />
            )}
          </IconButton>
        )}
        {quote.status === 'ACCEPTED' && (
          <IconButton
            size="small"
            title="Voir facture"
            disabled={busy}
            color="secondary"
            onClick={openInvoiceOrConvert}
          >
            <ReceiptIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton size="small" title="Archiver" disabled={busy} onClick={onArchive}>
          <ArchiveIcon fontSize="small" />
        </IconButton>
      </Stack>
    )
  }

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
        {menuItems}
      </Menu>
    </>
  )
}
