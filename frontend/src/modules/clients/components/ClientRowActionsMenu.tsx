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
import DeleteIcon from '@mui/icons-material/Delete'
import DescriptionIcon from '@mui/icons-material/Description'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'

type ClientRowActionsMenuProps = {
  expanded?: boolean
  onView: () => void
  onEdit: () => void
  onDelete: () => void
  onNewQuote?: () => void
  onNewInvoice?: () => void
}

export function ClientRowActionsMenu({
  expanded = false,
  onView,
  onEdit,
  onDelete,
  onNewQuote,
  onNewInvoice,
}: ClientRowActionsMenuProps) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const close = () => setAnchor(null)

  const menuItems = [
    <MenuItem key="view" onClick={() => { close(); onView() }}>
      <ListItemIcon>
        <VisibilityIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Voir la fiche</ListItemText>
    </MenuItem>,
    <MenuItem key="edit" onClick={() => { close(); onEdit() }}>
      <ListItemIcon>
        <EditIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText>Modifier</ListItemText>
    </MenuItem>,
    ...(onNewQuote
      ? [
          <MenuItem key="quote" onClick={() => { close(); onNewQuote() }}>
            <ListItemIcon>
              <DescriptionIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Nouveau devis</ListItemText>
          </MenuItem>,
        ]
      : []),
    ...(onNewInvoice
      ? [
          <MenuItem key="invoice" onClick={() => { close(); onNewInvoice() }}>
            <ListItemIcon>
              <ReceiptLongIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Nouvelle facture</ListItemText>
          </MenuItem>,
        ]
      : []),
    <Divider key="divider" />,
    <MenuItem key="delete" onClick={() => { close(); onDelete() }} sx={{ color: 'error.main' }}>
      <ListItemIcon>
        <DeleteIcon fontSize="small" color="error" />
      </ListItemIcon>
      <ListItemText>Archiver</ListItemText>
    </MenuItem>,
  ]

  if (expanded) {
    return (
      <Stack direction="row" spacing={0.25} justifyContent="center" flexWrap="nowrap">
        <IconButton size="small" title="Voir" onClick={onView}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" title="Modifier" onClick={onEdit}>
          <EditIcon fontSize="small" />
        </IconButton>
        {onNewQuote && (
          <IconButton size="small" title="Devis" onClick={onNewQuote}>
            <DescriptionIcon fontSize="small" />
          </IconButton>
        )}
        {onNewInvoice && (
          <IconButton size="small" title="Facture" onClick={onNewInvoice}>
            <ReceiptLongIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton size="small" title="Archiver" color="error" onClick={onDelete}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Stack>
    )
  }

  return (
    <>
      <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label="Actions">
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        {menuItems}
      </Menu>
    </>
  )
}
