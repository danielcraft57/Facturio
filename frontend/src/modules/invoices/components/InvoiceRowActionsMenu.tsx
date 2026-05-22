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
  /** Afficher les boutons principaux en ligne (desktop large). */
  expanded?: boolean
}

export function InvoiceRowActionsMenu({
  invoice,
  busy,
  expanded = false,
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

  const close = () => setAnchor(null)

  const menuItems = [
    <MenuItem key="view" onClick={() => { close(); onView() }} disabled={busy}>
      <ListItemIcon>
        <VisibilityIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Voir</ListItemText>
    </MenuItem>,
    <MenuItem key="edit" onClick={() => { close(); onEdit() }} disabled={busy}>
      <ListItemIcon>
        <EditIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Éditer</ListItemText>
    </MenuItem>,
    ...(canSend
      ? [
          <MenuItem key="send" onClick={() => { close(); onSend() }} disabled={busy}>
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
    ...(canRemind && onRemind
      ? [
          <MenuItem key="remind" onClick={() => { close(); onRemind() }} disabled={busy}>
            <ListItemIcon>
              <NotificationsActiveIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Relancer</ListItemText>
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
    <MenuItem key="pdf" onClick={() => { close(); onDownload() }} disabled={busy}>
      <ListItemIcon>
        <DownloadIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>PDF</ListItemText>
    </MenuItem>,
  ]

  if (expanded) {
    return (
      <Stack direction="row" spacing={0.25} justifyContent="center" flexWrap="nowrap">
        <IconButton size="small" title="Voir" disabled={busy} onClick={onView}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" title="Éditer" disabled={busy} onClick={onEdit}>
          <EditIcon fontSize="small" />
        </IconButton>
        {canSend && (
          <IconButton
            size="small"
            title={emailed ? 'Email envoyé' : 'Envoyer'}
            disabled={busy}
            color={emailed ? 'success' : 'default'}
            onClick={onSend}
          >
            {emailed ? <MarkEmailReadIcon fontSize="small" /> : <SendIcon fontSize="small" />}
          </IconButton>
        )}
        {canRemind && onRemind && (
          <IconButton size="small" title="Relancer" disabled={busy} color="warning" onClick={onRemind}>
            <NotificationsActiveIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton size="small" title="Archiver" disabled={busy} onClick={onArchive}>
          <ArchiveIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" title="PDF" disabled={busy} onClick={onDownload}>
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Stack>
    )
  }

  return (
    <>
      <IconButton size="small" disabled={busy} onClick={(e) => setAnchor(e.currentTarget)} aria-label="Actions">
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        {menuItems}
      </Menu>
    </>
  )
}
