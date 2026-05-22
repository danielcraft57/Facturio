import type { SxProps, Theme } from '@mui/material'
import { alpha } from '@mui/material/styles'

/** Bouton principal style finance (navy). */
export const financePrimaryButtonSx: SxProps<Theme> = {
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: 2,
  bgcolor: '#0f172a',
  boxShadow: `0 4px 14px ${alpha('#0f172a', 0.2)}`,
  '&:hover': { bgcolor: '#1e3a5f' },
}

/** Carte de page (filtres, tableaux). */
export const financeCardSx: SxProps<Theme> = (theme) => ({
  borderRadius: 2.5,
  border: '1px solid',
  borderColor: theme.palette.mode === 'dark' ? alpha('#fff', 0.08) : alpha('#0f172a', 0.08),
  boxShadow:
    theme.palette.mode === 'dark'
      ? 'none'
      : `0 1px 3px ${alpha('#0f172a', 0.06)}, 0 8px 24px ${alpha('#0f172a', 0.04)}`,
  overflow: 'hidden',
})

/** Cartes KPI dashboard. */
export const financeKpiGradients = {
  revenue: 'linear-gradient(145deg, #0f172a 0%, #1e3a5f 100%)',
  unpaid: 'linear-gradient(145deg, #7f1d1d 0%, #b91c1c 100%)',
  clients: 'linear-gradient(145deg, #064e3b 0%, #047857 100%)',
  conversion: 'linear-gradient(145deg, #78350f 0%, #b45309 100%)',
} as const

export const financePagePadding = { xs: 1, sm: 2, md: 3 } as const

/** En-tête de tableau style finance. */
export const financeTableHeadSx: SxProps<Theme> = (theme) => ({
  '& .MuiTableCell-head': {
    fontWeight: 700,
    fontSize: '0.72rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.palette.text.secondary,
    bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.04) : alpha('#0f172a', 0.03),
    borderBottom: `1px solid ${alpha('#0f172a', 0.1)}`,
    py: 1.25,
  },
})

export const financeTableSx: SxProps<Theme> = {
  '& .MuiTableRow-root:hover': {
    bgcolor: alpha('#0f172a', 0.03),
  },
}

/** Bouton secondaire finance (outline navy). */
export const financeOutlinedButtonSx: SxProps<Theme> = {
  textTransform: 'none',
  fontWeight: 600,
  borderRadius: 2,
  borderColor: alpha('#0f172a', 0.25),
  color: '#0f172a',
  '&:hover': {
    borderColor: '#1e3a5f',
    bgcolor: alpha('#0f172a', 0.04),
  },
}
