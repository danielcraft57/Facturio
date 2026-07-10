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
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import SendIcon from '@mui/icons-material/Send'
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import ArchiveIcon from '@mui/icons-material/Archive'
import DownloadIcon from '@mui/icons-material/Download'
import type { Invoice } from '../../../services/invoices'
import { wasInvoiceEmailed } from '../invoiceEmailUi'

export type InvoiceRowActionsHandlers = {
  busy: boolean
  onView: () => void
  onEdit: () => void
  onSend: () => void
  onRemind?: () => void
  onArchive: () => void
  onDownload: () => void
  canSend: boolean
  canRemind: boolean
}

type InvoiceRowActionsMenuProps = InvoiceRowActionsHandlers & {
  invoice: Invoice
  /** @deprecated Toujours menu « … » (phase UX navigation). */
  expanded?: boolean
}

/**
 * Actions ligne facture : menu compact, archivage séparé en bas.
 */
export function InvoiceRowActionsMenu({
  invoice,
  busy,
  onView,
  onEdit,
  onSend,
  onRemind,
  onArchive,
  onDownload,
  canSend,
  canRemind,
}: InvoiceRowActionsMenuProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const emailed = wasInvoiceEmailed(invoice)
  const isDraft = invoice.status === 'draft'

  const close = () => setAnchor(null)

  return (
    <>
      <IconButton size="small" disabled={busy} onClick={(e) => setAnchor(e.currentTarget)} aria-label="Actions facture">
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        {isDraft ? (
          <MenuItem onClick={() => { close(); onEdit() }} disabled={busy}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Modifier</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { close(); onView() }} disabled={busy}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Voir</ListItemText>
          </MenuItem>
        )}
        {canSend ? (
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
        {canRemind && onRemind ? (
          <MenuItem onClick={() => { close(); onRemind() }} disabled={busy}>
            <ListItemIcon>
              <NotificationsActiveIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Relancer</ListItemText>
          </MenuItem>
        ) : null}
        <MenuItem onClick={() => { close(); onDownload() }} disabled={busy}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Télécharger PDF</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5, display: 'block' }}>
          Retrait de la liste
        </Typography>
        <MenuItem
          onClick={() => { close(); onArchive() }}
          disabled={busy}
          sx={{ color: 'warning.dark' }}
        >
          <ListItemIcon>
            <ArchiveIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Archiver</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
