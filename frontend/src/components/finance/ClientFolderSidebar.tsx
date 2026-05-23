import { Link } from 'react-router-dom'
import {
  Box,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import BusinessIcon from '@mui/icons-material/Business'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import AddIcon from '@mui/icons-material/Add'
import {
  CLIENT_FOLDER_LABELS,
  CLIENT_FOLDERS,
  type ClientFolder,
} from '../../types/clientFolders'
import type { ClientFolderCounts } from '../../services/clients'
import {
  FOLDER_NAVY,
  documentFolderItemSx,
  documentFolderNewButtonSx,
  documentFolderSidebarSx,
} from './documentFolderStyles'

const FOLDER_ICONS: Record<ClientFolder, React.ReactNode> = {
  inbox: <FolderOpenIcon fontSize="small" />,
  actifs: <CheckCircleOutlineIcon fontSize="small" />,
  inactifs: <PauseCircleOutlineIcon fontSize="small" />,
  prospects: <PersonSearchIcon fontSize="small" />,
  entreprises: <BusinessIcon fontSize="small" />,
  particuliers: <PersonOutlineIcon fontSize="small" />,
}

type ClientFolderSidebarProps = {
  counts: ClientFolderCounts
  activeFolder: ClientFolder
  onNew: () => void
  newLabel: string
  mobileOpen?: boolean
  onMobileClose?: () => void
  countsLoading?: boolean
}

function SidebarContent({
  counts,
  activeFolder,
  onNew,
  newLabel,
  onNavigate,
  countsLoading = false,
}: ClientFolderSidebarProps & { onNavigate?: () => void }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1.5, pb: 1 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            onNew()
            onNavigate?.()
          }}
          sx={documentFolderNewButtonSx}
        >
          {newLabel}
        </Button>
      </Box>

      <List dense sx={{ flex: 1, px: 0.75, py: 0.5 }}>
        {CLIENT_FOLDERS.map((folder) => {
          const count = counts[folder] ?? 0
          const selected = activeFolder === folder
          return (
            <ListItemButton
              key={folder}
              component={Link}
              to={`/clients/${folder}`}
              selected={selected}
              onClick={onNavigate}
              sx={documentFolderItemSx(selected)}
            >
              <ListItemIcon
                sx={{
                  minWidth: 34,
                  color: selected ? FOLDER_NAVY : 'text.secondary',
                }}
              >
                {FOLDER_ICONS[folder]}
              </ListItemIcon>
              <ListItemText
                primary={CLIENT_FOLDER_LABELS[folder]}
                primaryTypographyProps={{
                  fontSize: '0.8125rem',
                  fontWeight: selected ? 700 : 500,
                  color: selected ? FOLDER_NAVY : 'text.primary',
                }}
              />
              {countsLoading ? (
                <Skeleton variant="rounded" width={22} height={18} animation="wave" />
              ) : count > 0 ? (
                <Typography
                  variant="caption"
                  fontWeight={700}
                  sx={{
                    minWidth: 20,
                    textAlign: 'right',
                    color: folder === 'prospects' ? 'warning.main' : 'text.secondary',
                  }}
                >
                  {count}
                </Typography>
              ) : null}
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )
}

export function ClientFolderSidebar(props: ClientFolderSidebarProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={props.mobileOpen ?? false}
        onClose={props.onMobileClose}
        PaperProps={{ sx: { width: 280 } }}
      >
        <SidebarContent {...props} onNavigate={props.onMobileClose} />
      </Drawer>
    )
  }

  return (
    <Box sx={documentFolderSidebarSx}>
      <SidebarContent {...props} />
    </Box>
  )
}

export function ClientFolderMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton onClick={onClick} sx={{ display: { md: 'none' } }} aria-label="Menu catégories">
      <MenuIcon />
    </IconButton>
  )
}
