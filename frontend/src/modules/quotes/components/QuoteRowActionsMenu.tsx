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
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import ReceiptIcon from '@mui/icons-material/Receipt'
import ArchiveIcon from '@mui/icons-material/Archive'
import type { Quote } from '../../../types/quote'

export type QuoteRowActionsHandlers = {
  busy?: boolean
  onSend: () => void
  onAccept: () => void
  onReject: () => void
  onConvert: () => void
  onArchive: () => void
}

type QuoteRowActionsMenuProps = QuoteRowActionsHandlers & {
  quote: Quote
  /** Boutons en ligne (desktop large). */
  expanded?: boolean
}

export function QuoteRowActionsMenu({
  quote,
  busy = false,
  expanded = false,
  onSend,
  onAccept,
  onReject,
  onConvert,
  onArchive,
}: QuoteRowActionsMenuProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const close = () => setAnchor(null)

  const menuItems = [
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
          <MenuItem key="accept" onClick={() => { close(); onAccept() }} disabled={busy}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Accepter</ListItemText>
          </MenuItem>,
          <MenuItem key="reject" onClick={() => { close(); onReject() }} disabled={busy}>
            <ListItemIcon>
              <CancelIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Rejeter</ListItemText>
          </MenuItem>,
        ]
      : []),
    ...(quote.status === 'ACCEPTED'
      ? [
          <MenuItem key="convert" onClick={() => { close(); onConvert() }} disabled={busy}>
            <ListItemIcon>
              <ReceiptIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Voir facture</ListItemText>
          </MenuItem>,
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
        {quote.status === 'DRAFT' && (
          <IconButton size="small" title="Envoyer" disabled={busy} onClick={onSend}>
            <SendIcon fontSize="small" />
          </IconButton>
        )}
        {quote.status === 'SENT' && (
          <>
            <IconButton size="small" title="Accepter" disabled={busy} color="success" onClick={onAccept}>
              <CheckCircleIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" title="Rejeter" disabled={busy} color="error" onClick={onReject}>
              <CancelIcon fontSize="small" />
            </IconButton>
          </>
        )}
        {quote.status === 'ACCEPTED' && (
          <IconButton size="small" title="Voir facture" disabled={busy} color="secondary" onClick={onConvert}>
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
