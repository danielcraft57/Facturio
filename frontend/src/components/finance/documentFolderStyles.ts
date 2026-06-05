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

export const documentFolderTableCardSx: SxProps<Theme> = (theme) => ({
  ...(typeof financeCardSx === 'function' ? financeCardSx(theme) : financeCardSx),
  display: 'flex',
  flexDirection: 'column',
})

export const documentFolderTableCardWrapSx: SxProps<Theme> = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
}

/** Tableau bord à bord : barre de statut collée au bord gauche de la carte. */
export const documentFolderTableCardContentSx: SxProps<Theme> = {
  p: '0 !important',
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  '&:last-child': { pb: '0 !important' },
}

export const documentFolderTableCardContentPaddedSx: SxProps<Theme> = {
  px: { xs: 1, sm: 1.5, md: 2 },
  py: { xs: 1, sm: 1.5, md: 2 },
}

/** Rayon intérieur aligné sur `financeCardSx` (borderRadius 2.5). */
export const documentFolderCardInnerRadius = (theme: Theme) =>
  typeof theme.shape.borderRadius === 'number' ? theme.shape.borderRadius * 2.5 : 10

/** Pied de carte (charger plus, vide) — continu avec le tableau, sans effet flottant. */
export const documentFolderTableCardFooterSx: SxProps<Theme> = (theme) => {
  const innerRadius = documentFolderCardInnerRadius(theme)
  return {
    borderTop: `1px solid ${alpha(FOLDER_NAVY, theme.palette.mode === 'dark' ? 0.14 : 0.08)}`,
    bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.02) : alpha(FOLDER_NAVY, 0.015),
    px: { xs: 1, sm: 1.5, md: 2 },
    py: { xs: 1.25, sm: 1.5 },
    borderBottomLeftRadius: innerRadius,
    borderBottomRightRadius: innerRadius,
  }
}

/** Défilement horizontal uniquement (colonnes masquées sur petit écran) — pas de hauteur max. */
export const documentFolderTableContainerSx: SxProps<Theme> = (theme) => {
  const thumb = alpha(FOLDER_NAVY, theme.palette.mode === 'dark' ? 0.38 : 0.2)
  const innerRadius = documentFolderCardInnerRadius(theme)
  return {
    width: '100%',
    maxWidth: '100%',
    m: 0,
    p: 0,
    flex: '1 1 auto',
    bgcolor: 'background.paper',
    borderTopLeftRadius: innerRadius,
    borderTopRightRadius: innerRadius,
    '& .MuiTable-root': {
      width: '100%',
      minWidth: '100%',
    },
    '& .MuiTableHead-root .MuiTableCell-head:first-of-type': {
      borderTopLeftRadius: innerRadius,
    },
    '& .MuiTableHead-root .MuiTableCell-head:last-of-type': {
      borderTopRightRadius: innerRadius,
    },
    overflowX: 'auto',
    overflowY: 'hidden',
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
  minWidth: '100%',
  tableLayout: 'fixed',
  borderCollapse: 'collapse',
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
  '& .MuiTableCell-root.doc-folder-bulk-cell': {
    verticalAlign: 'middle',
  },
  '& tr.document-folder-table-row:hover': {
    bgcolor: (t) => alpha(FOLDER_NAVY, t.palette.mode === 'dark' ? 0.06 : 0.025),
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

export const documentFolderTableHeadSx: SxProps<Theme> = (theme) => {
  const headBg = theme.palette.mode === 'dark' ? alpha('#fff', 0.04) : alpha('#0f172a', 0.03)
  const headBorder = `1px solid ${alpha('#0f172a', 0.1)}`
  return {
    [`&:hover .${documentFolderBulkCheckboxClass}`]: {
      opacity: 1,
      pointerEvents: 'auto',
    },
    '& .MuiTableCell-head.doc-folder-rail-cell, & .MuiTableCell-head.doc-folder-bulk-cell': {
      bgcolor: headBg,
      borderBottom: headBorder,
    },
  }
}

export const documentFolderColInvoiceSx: SxProps<Theme> = {
  width: '15%',
  minWidth: 120,
  pl: { md: 0.75, lg: 1 },
}

export const documentFolderColClientSx: SxProps<Theme> = {
  width: 'auto',
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
  width: expanded ? '16%' : '9%',
  minWidth: expanded ? 148 : 44,
  whiteSpace: 'nowrap',
  px: { md: 0.5, lg: 0.75 },
})

/** Colonnes liste clients (statut = rail, pas de colonne dédiée). */
export const clientFolderColClientSx: SxProps<Theme> = {
  width: 'auto',
  minWidth: 160,
  pl: { md: 0.75, lg: 1 },
}

export const clientFolderColContactSx: SxProps<Theme> = {
  ...folderColHideBelowLg,
  width: '22%',
  minWidth: 140,
}

export const clientFolderColRevenueSx: SxProps<Theme> = {
  ...documentFolderColAmountSx,
  width: '14%',
}

export const clientFolderColLastInvoiceSx: SxProps<Theme> = {
  ...folderColHideBelowXl,
  width: '12%',
  minWidth: 108,
}

export const clientFolderColSirenSx: SxProps<Theme> = {
  ...folderColHideBelowXl,
  width: '11%',
  minWidth: 96,
}

export const clientFolderTableBodyCellSx: SxProps<Theme> = {
  verticalAlign: 'middle',
}

/** Scroll horizontal uniquement si le contenu dépasse (pas de minWidth > 100%). */
export const clientFolderTableScrollSx: SxProps<Theme> = {
  minWidth: 0,
}

export const documentFolderPageSubtitle = (resource: 'factures' | 'devis' | 'dettes') => {
  if (resource === 'factures') return 'Documents émis — les plus récents en premier'
  if (resource === 'dettes') return 'Dettes enregistrées — les plus récentes en premier'
  return 'Devis émis — les plus récents en premier'
}

export const documentFolderUnreadRowSx: SxProps<Theme> = {
  bgcolor: 'transparent',
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
