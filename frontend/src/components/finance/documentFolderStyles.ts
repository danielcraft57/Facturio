import type { SxProps, Theme } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { financeCardSx, financePrimaryButtonSx } from './financeStyles'

export const FOLDER_NAVY = '#0f172a'

export const documentFolderToolbarSx: SxProps<Theme> = {
  flexShrink: 0,
  px: { xs: 1.5, sm: 2, md: 3 },
  pt: { xs: 1.5, sm: 2 },
  pb: { xs: 1, sm: 1.5 },
  borderBottom: 1,
  borderColor: 'divider',
  bgcolor: (t) => (t.palette.mode === 'dark' ? 'background.paper' : '#fff'),
  position: 'sticky',
  top: 0,
  zIndex: (t) => t.zIndex.appBar - 1,
}

/** Barre de filtres : recherche pleine largeur, filtres secondaires en dessous. */
export const documentFolderToolbarFiltersSx: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.25,
}

export const documentFolderSecondaryFiltersSx: SxProps<Theme> = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 1,
  alignItems: 'center',
  '& > *': {
    flex: { xs: '1 1 100%', sm: '1 1 auto' },
    minWidth: { xs: '100%', sm: 140 },
  },
}

export const documentFolderPageMainSx: SxProps<Theme> = {
  flex: 1,
  minWidth: 0,
  overflow: 'auto',
  p: { xs: 1.5, sm: 2, md: 3 },
  bgcolor: (t) => (t.palette.mode === 'dark' ? 'background.default' : alpha(FOLDER_NAVY, 0.02)),
}

export const documentFolderSidebarSx: SxProps<Theme> = {
  width: 232,
  flexShrink: 0,
  borderRight: 1,
  borderColor: 'divider',
  bgcolor: (t) => (t.palette.mode === 'dark' ? alpha('#fff', 0.02) : '#fff'),
  display: { xs: 'none', md: 'flex' },
  flexDirection: 'column',
}

export const documentFolderNewButtonSx: SxProps<Theme> = {
  ...financePrimaryButtonSx,
  borderRadius: 2.5,
  py: 1.05,
  fontSize: '0.875rem',
}

export const documentFolderItemSx = (selected: boolean): SxProps<Theme> => ({
  borderRadius: 2,
  mb: 0.25,
  py: 0.75,
  transition: 'background-color 0.18s ease, color 0.18s ease',
  '&.Mui-selected': {
    bgcolor: alpha(FOLDER_NAVY, 0.08),
    color: FOLDER_NAVY,
    '& .MuiListItemIcon-root': { color: FOLDER_NAVY },
    '&:hover': { bgcolor: alpha(FOLDER_NAVY, 0.12) },
  },
})

export const documentFolderFilterCardSx: SxProps<Theme> = {
  mb: 2,
  ...financeCardSx,
}

export const documentFolderFilterGridSx: SxProps<Theme> = {
  display: 'grid',
  gap: 1.5,
  gridTemplateColumns: {
    xs: '1fr',
    sm: '1fr 1fr',
    md: 'minmax(200px, 2fr) minmax(140px, 1fr) minmax(140px, 1fr) auto',
  },
  alignItems: 'center',
}

export const documentFolderTableCardSx: SxProps<Theme> = financeCardSx

export const documentFolderTableCardWrapSx: SxProps<Theme> = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
}

export const documentFolderTableContainerSx: SxProps<Theme> = {
  width: '100%',
  maxWidth: '100%',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
}

export const documentFolderTableSx: SxProps<Theme> = {
  width: '100%',
  tableLayout: 'fixed',
  '& .MuiTableCell-root': {
    px: { md: 1, lg: 1.5 },
    py: { md: 1, lg: 1.25 },
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}

/** Masquer une colonne en dessous d’un breakpoint (table-cell). */
export const folderColHideBelowLg: SxProps<Theme> = {
  display: { xs: 'none', lg: 'table-cell' },
}

export const folderColHideBelowXl: SxProps<Theme> = {
  display: { xs: 'none', xl: 'table-cell' },
}

export const documentFolderPageSubtitle = (resource: 'factures' | 'devis') =>
  resource === 'factures'
    ? 'Documents émis — les plus récents en premier'
    : 'Devis émis — les plus récents en premier'

export const documentFolderUnreadRowSx: SxProps<Theme> = {
  bgcolor: alpha('#3b82f6', 0.04),
  borderLeft: `3px solid ${alpha('#3b82f6', 0.55)}`,
}
