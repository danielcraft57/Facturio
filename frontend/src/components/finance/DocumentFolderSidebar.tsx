import { Link, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
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
import VisibilityIcon from '@mui/icons-material/Visibility'
import TouchAppIcon from '@mui/icons-material/TouchApp'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import PaidIcon from '@mui/icons-material/Paid'
import BlockIcon from '@mui/icons-material/Block'
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutline'
import {
  DOCUMENT_FOLDER_LABELS,
  formatDocumentFolderCount,
  type DocumentFolder,
  type DocumentFolderCounts,
} from '../../types/documentFolders'
import { getDocumentFolderNav, type DocumentFolderResource } from '../../config/documentFolderNav'
import { documentFolderSidebarSx } from './documentFolderStyles'
import { GroupedFolderSidebarContent } from './GroupedFolderSidebar'

const FOLDER_ICONS: Partial<Record<DocumentFolder, React.ReactNode>> = {
  inbox: <FolderOpenIcon fontSize="small" />,
  nouveau: <MarkEmailUnreadIcon fontSize="small" />,
  suivi: <StarIcon fontSize="small" />,
  attente: <ScheduleIcon fontSize="small" />,
  important: <LabelImportantIcon fontSize="small" />,
  envoyes: <SendIcon fontSize="small" />,
  brouillons: <DraftsIcon fontSize="small" />,
  status_draft: <DraftsIcon fontSize="small" />,
  status_sent: <SendIcon fontSize="small" />,
  status_viewed: <VisibilityIcon fontSize="small" />,
  status_clicked: <TouchAppIcon fontSize="small" />,
  status_accepted: <ThumbUpIcon fontSize="small" />,
  status_rejected: <ThumbDownIcon fontSize="small" />,
  status_expired: <ScheduleIcon fontSize="small" />,
  status_overdue: <WarningAmberIcon fontSize="small" />,
  status_paid: <PaidIcon fontSize="small" />,
  status_cancelled: <BlockIcon fontSize="small" />,
  status_partial: <PieChartOutlineIcon fontSize="small" />,
}

type DocumentFolderSidebarProps = {
  resource: DocumentFolderResource
  /** Préfixe de route (ex. `/dettes`). Par défaut `/${resource}`. */
  basePath?: string
  /** Dossiers masqués (ex. pas d’« Important » sur les dettes). */
  excludeFolders?: DocumentFolder[]
  counts: DocumentFolderCounts
  activeFolder: DocumentFolder
  onNew: () => void
  newLabel: string
  mobileOpen?: boolean
  onMobileClose?: () => void
  countsLoading?: boolean
}

function SidebarContent({
  resource,
  basePath,
  excludeFolders = [],
  counts,
  activeFolder,
  onNew,
  newLabel,
  onNavigate,
  countsLoading = false,
}: DocumentFolderSidebarProps & { onNavigate?: () => void }) {
  const base = basePath ?? `/${resource}`
  const location = useLocation()
  const archivesActive = location.pathname.endsWith('/archives')
  const nav = getDocumentFolderNav(resource, excludeFolders)

  return (
    <GroupedFolderSidebarContent
      basePath={base}
      nav={{
        ...nav,
        trailing: [
          {
            id: 'archives',
            label: 'Archives',
            to: `${base}/archives`,
            icon: <ArchiveIcon fontSize="small" />,
          },
        ],
      }}
      labels={DOCUMENT_FOLDER_LABELS}
      icons={FOLDER_ICONS}
      counts={counts}
      activeFolder={activeFolder}
      activeTrailingId={archivesActive ? 'archives' : null}
      onNew={onNew}
      newLabel={newLabel}
      onNavigate={onNavigate}
      countsLoading={countsLoading}
      highlightFolder="nouveau"
    />
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
