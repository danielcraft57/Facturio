import { Link } from 'react-router-dom'
import {
  Box,
  Button,
  Divider,
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
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread'
import StarIcon from '@mui/icons-material/Star'
import ScheduleIcon from '@mui/icons-material/Schedule'
import LabelImportantIcon from '@mui/icons-material/LabelImportant'
import SendIcon from '@mui/icons-material/Send'
import DraftsIcon from '@mui/icons-material/Drafts'
import ArchiveIcon from '@mui/icons-material/Archive'
import AddIcon from '@mui/icons-material/Add'
import {
  DOCUMENT_FOLDER_LABELS,
  DOCUMENT_FOLDERS,
  type DocumentFolder,
  type DocumentFolderCounts,
} from '../../types/documentFolders'
import {
  FOLDER_NAVY,
  documentFolderItemSx,
  documentFolderNewButtonSx,
  documentFolderSidebarSx,
} from './documentFolderStyles'

const FOLDER_ICONS: Record<DocumentFolder, React.ReactNode> = {
  inbox: <FolderOpenIcon fontSize="small" />,
  nouveau: <MarkEmailUnreadIcon fontSize="small" />,
  suivi: <StarIcon fontSize="small" />,
  attente: <ScheduleIcon fontSize="small" />,
  important: <LabelImportantIcon fontSize="small" />,
  envoyes: <SendIcon fontSize="small" />,
  brouillons: <DraftsIcon fontSize="small" />,
}

type DocumentFolderSidebarProps = {
  resource: 'factures' | 'devis'
  counts: DocumentFolderCounts
  activeFolder: DocumentFolder
  onNew: () => void
  newLabel: string
  mobileOpen?: boolean
  onMobileClose?: () => void
  /** Compteurs dossiers encore en chargement. */
  countsLoading?: boolean
}

function SidebarContent({
  resource,
  counts,
  activeFolder,
  onNew,
  newLabel,
  onNavigate,
  countsLoading = false,
}: DocumentFolderSidebarProps & { onNavigate?: () => void }) {
  const base = `/${resource}`

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
        {DOCUMENT_FOLDERS.map((folder) => {
          const count = counts[folder] ?? 0
          const selected = activeFolder === folder
          return (
            <ListItemButton
              key={folder}
              component={Link}
              to={`${base}/${folder}`}
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
                primary={DOCUMENT_FOLDER_LABELS[folder]}
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
                    color: folder === 'nouveau' ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {count}
                </Typography>
              ) : null}
            </ListItemButton>
          )
        })}
      </List>

      <Divider sx={{ mx: 1 }} />
      <List dense sx={{ px: 0.75, py: 0.5 }}>
        <ListItemButton
          component={Link}
          to={`${base}/archives`}
          onClick={onNavigate}
          sx={{ borderRadius: 2, py: 0.75 }}
        >
          <ListItemIcon sx={{ minWidth: 34, color: 'text.secondary' }}>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Archives"
            primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: 500 }}
          />
        </ListItemButton>
      </List>
    </Box>
  )
}

export function DocumentFolderSidebar(props: DocumentFolderSidebarProps) {
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

export function DocumentFolderMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <IconButton onClick={onClick} sx={{ display: { md: 'none' } }} aria-label="Menu dossiers">
      <MenuIcon />
    </IconButton>
  )
}
