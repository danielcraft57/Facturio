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

/** Scrollbar discrète (zone liste factures / devis / clients). */
export const documentFolderScrollbarSx: SxProps<Theme> = (theme) => {
  const thumb = alpha(FOLDER_NAVY, theme.palette.mode === 'dark' ? 0.38 : 0.2)
  const thumbHover = alpha(FOLDER_NAVY, theme.palette.mode === 'dark' ? 0.52 : 0.32)
  return {
    scrollbarWidth: 'thin',
    scrollbarColor: `${thumb} transparent`,
    '&::-webkit-scrollbar': {
      width: 8,
      height: 8,
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: thumb,
      borderRadius: 8,
      border: '2px solid transparent',
      backgroundClip: 'padding-box',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: thumbHover,
    },
    '&::-webkit-scrollbar-corner': {
      background: 'transparent',
    },
  }
}

export const documentFolderPageMainSx: SxProps<Theme> = (theme) => ({
  flex: 1,
  minWidth: 0,
  overflow: 'auto',
  overflowX: 'hidden',
  scrollbarGutter: 'stable',
  pt: { xs: 1.5, sm: 2, md: 2 },
  pr: { xs: 1.5, sm: 2, md: 3 },
  pb: { xs: 1.5, sm: 2, md: 3 },
  pl: { xs: 1.5, sm: 2, md: 0.5 },
  bgcolor: theme.palette.mode === 'dark' ? 'background.default' : alpha(FOLDER_NAVY, 0.02),
  ...(typeof documentFolderScrollbarSx === 'function'
    ? documentFolderScrollbarSx(theme)
    : documentFolderScrollbarSx),
})

export const documentFolderSidebarSx: SxProps<Theme> = {
  width: 232,
  flexShrink: 0,
  borderRight: 1,
  borderColor: 'divider',
  bgcolor: (t) => (t.palette.mode === 'dark' ? alpha('#fff', 0.02) : '#fff'),
  display: { xs: 'none', md: 'flex' },
  flexDirection: 'column',
  borderRadius: 2,
}

/** Sidebar + zone liste : espacement horizontal entre les deux. */
export const documentFolderLayoutRowSx: SxProps<Theme> = {
  display: 'flex',
  flex: 1,
  minHeight: 0,
  position: 'relative',
  mt: { xs: 0.75, md: 1.5 },
  gap: { xs: 0, md: 2.5 },
  alignItems: 'stretch',
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

/** Tableau bord à bord : barre de statut collée au bord gauche de la carte. */
export const documentFolderTableCardContentSx: SxProps<Theme> = {
  p: 0,
  '&:last-child': { pb: { xs: 1, sm: 1.5, md: 2 } },
}

export const documentFolderTableCardContentPaddedSx: SxProps<Theme> = {
  px: { xs: 1, sm: 1.5, md: 2 },
  py: { xs: 1, sm: 1.5, md: 2 },
}

/** Défilement horizontal uniquement (colonnes masquées sur petit écran) — pas de hauteur max. */
export const documentFolderTableContainerSx: SxProps<Theme> = (theme) => {
  const thumb = alpha(FOLDER_NAVY, theme.palette.mode === 'dark' ? 0.38 : 0.2)
  return {
    width: '100%',
    maxWidth: '100%',
    overflowX: 'auto',
    overflowY: 'visible',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin',
    scrollbarColor: `${thumb} transparent`,
    '&::-webkit-scrollbar': { height: 6 },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: thumb,
      borderRadius: 6,
      border: '2px solid transparent',
      backgroundClip: 'padding-box',
    },
  }
}

export const documentFolderBulkCellClass = 'doc-folder-bulk-cell'

export const documentFolderTableSx: SxProps<Theme> = {
  width: '100%',
  tableLayout: 'fixed',
  '& .MuiTableCell-root': {
    px: { md: 1, lg: 1.25 },
    py: { md: 1, lg: 1.25 },
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  [`& .MuiTableCell-root.${documentFolderBulkCellClass}`]: {
    px: 0,
    py: 0,
    overflow: 'visible',
  },
  '& .MuiTableCell-root.doc-folder-rail-cell': {
    px: 0,
    py: 0,
    overflow: 'visible',
    textOverflow: 'clip',
    verticalAlign: 'middle',
    borderLeft: 'none',
  },
  '& tr.document-folder-table-row:hover': {
    position: 'relative',
    zIndex: 2,
  },
  '& .doc-folder-col-amount': {
    overflow: 'visible',
    textOverflow: 'clip',
  },
}

/** Masquer une colonne en dessous d’un breakpoint (table-cell). */
export const folderColHideBelowLg: SxProps<Theme> = {
  display: { xs: 'none', lg: 'table-cell' },
}

export const folderColHideBelowXl: SxProps<Theme> = {
  display: { xs: 'none', xl: 'table-cell' },
}

export const documentFolderBulkCheckboxClass = 'doc-folder-bulk-cb'

export const documentFolderBulkCheckboxSx: SxProps<Theme> = {
  p: 0,
  m: 0,
  transition: 'opacity 0.15s ease',
  color: (t) => alpha(t.palette.text.primary, 0.42),
  '&.Mui-checked': {
    color: 'primary.main',
  },
}

export const documentFolderTableHeadSx: SxProps<Theme> = {
  [`&:hover .${documentFolderBulkCheckboxClass}`]: {
    opacity: 1,
    pointerEvents: 'auto',
  },
}

export const documentFolderColInvoiceSx: SxProps<Theme> = {
  width: '15%',
  minWidth: 120,
  pl: { md: 0.75, lg: 1 },
}

export const documentFolderColClientSx: SxProps<Theme> = {
  width: '28%',
  minWidth: 140,
}

export const documentFolderColStatusSx: SxProps<Theme> = {
  width: '10%',
  minWidth: 92,
}

export const documentFolderColAmountSx: SxProps<Theme> = {
  width: '13%',
  minWidth: 112,
  whiteSpace: 'nowrap',
}

export const documentFolderColDueSx: SxProps<Theme> = {
  ...folderColHideBelowXl,
  width: '10%',
  minWidth: 96,
}

export const documentFolderColActionsSx = (expanded: boolean): SxProps<Theme> => ({
  width: expanded ? 188 : 52,
  minWidth: expanded ? 188 : 52,
  maxWidth: expanded ? 188 : 52,
  px: { md: 0.5, lg: 0.75 },
})

export const documentFolderPageSubtitle = (resource: 'factures' | 'devis' | 'dettes') => {
  if (resource === 'factures') return 'Documents émis — les plus récents en premier'
  if (resource === 'dettes') return 'Dettes enregistrées — les plus récentes en premier'
  return 'Devis émis — les plus récents en premier'
}

export const documentFolderUnreadRowSx: SxProps<Theme> = {
  bgcolor: alpha('#3b82f6', 0.04),
}

/** Colonne bulk (avant le rail), sans marge ni padding, case centrée. */
export const documentFolderBulkLeadCellSx: SxProps<Theme> = {
  width: 32,
  maxWidth: 32,
  minWidth: 32,
  p: 0,
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  textAlign: 'center',
  '&.MuiTableCell-paddingCheckbox': {
    width: 32,
    p: 0,
  },
  '& .MuiCheckbox-root': {
    p: 0,
    m: 0,
  },
}

/** Liste mobile : cases visibles au survol de la liste. */
export const documentFolderMobileListSx: SxProps<Theme> = {
  [`&:hover .${documentFolderBulkCheckboxClass}`]: { opacity: 1 },
}

export const documentFolderBulkRowSx = (
  selected: boolean,
  selectionActive: boolean,
): SxProps<Theme> => ({
  [`&:hover .${documentFolderBulkCheckboxClass}`]: {
    opacity: 1,
    pointerEvents: 'auto',
  },
  ...(selected || selectionActive
    ? {
        [`& .${documentFolderBulkCheckboxClass}`]: {
          opacity: 1,
          pointerEvents: 'auto',
        },
      }
    : {}),
  ...(selected
    ? {
        bgcolor: alpha('#3b82f6', 0.06),
      }
    : {}),
})
