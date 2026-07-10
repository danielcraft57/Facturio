import { useState } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
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
  /** @deprecated Toujours menu « … ». */
  expanded?: boolean
}

function wasQuoteEmailed(quote: Quote): boolean {
  const eng = quote.emailEngagement
  return Boolean(eng?.emailSent ?? quote.emailSent)
}

/**
 * Actions ligne devis : menu compact, archivage séparé.
 */
export function QuoteRowActionsMenu({
  quote,
  busy = false,
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

  return (
    <>
      <IconButton
        size="small"
        disabled={busy}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label="Actions devis"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem
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
        </MenuItem>
        {(quote.status === 'DRAFT' || quote.status === 'SENT') && onEdit ? (
          <MenuItem onClick={() => { close(); onEdit() }} disabled={busy}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Modifier</ListItemText>
          </MenuItem>
        ) : null}
        {quote.status === 'DRAFT' ? (
          <MenuItem onClick={() => { close(); onSend() }} disabled={busy}>
            <ListItemIcon>
              <SendIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Envoyer</ListItemText>
          </MenuItem>
        ) : null}
        {quote.status === 'SENT' ? (
          <MenuItem onClick={() => { close(); onSend() }} disabled={busy}>
            <ListItemIcon>
              {emailed ? (
                <MarkEmailReadIcon fontSize="small" color="success" />
              ) : (
                <SendIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>{emailed ? 'Renvoyer' : 'Envoyer'}</ListItemText>
          </MenuItem>
        ) : null}
        {quote.status === 'ACCEPTED' ? (
          <>
            <MenuItem onClick={() => { close(); openInvoiceOrConvert() }} disabled={busy}>
              <ListItemIcon>
                <ReceiptIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Voir facture</ListItemText>
            </MenuItem>
            {onRemindDeposit ? (
              <MenuItem
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
              </MenuItem>
            ) : null}
          </>
        ) : null}
        <Divider sx={{ my: 0.5 }} />
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: 'block' }}>
          Retrait de la liste
        </Typography>
        <MenuItem onClick={() => { close(); onArchive() }} disabled={busy} sx={{ color: 'warning.dark' }}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Archiver</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
