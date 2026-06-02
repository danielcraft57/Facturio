import { alpha, type Theme } from '@mui/material/styles'
import type { SxProps } from '@mui/material'

/** Style commun des entrées du menu top (actif, hover et clic persistants). */
export function topNavItemSx(theme: Theme, highlighted: boolean): SxProps<Theme> {
  const isDark = theme.palette.mode === 'dark'
  const bgActive = alpha(theme.palette.primary.main, isDark ? 0.12 : 0.06)
  const bgHover = alpha(theme.palette.primary.main, isDark ? 0.16 : 0.09)
  const underline = `inset 0 -2px 0 ${theme.palette.primary.main}`

  return {
    color: 'inherit',
    fontWeight: highlighted ? 600 : 500,
    fontSize: '0.9375rem',
    textTransform: 'none',
    px: 1.25,
    py: 0.75,
    minHeight: 40,
    borderRadius: 1.5,
    letterSpacing: '-0.01em',
    opacity: highlighted ? 1 : 0.88,
    boxShadow: highlighted ? underline : 'none',
    bgcolor: highlighted ? bgActive : 'transparent',
    transition: 'background-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease',
    '&:hover': {
      opacity: 1,
      bgcolor: bgHover,
      boxShadow: underline,
    },
    '&:active': {
      bgcolor: bgHover,
      boxShadow: underline,
    },
    '&.Mui-focusVisible': {
      bgcolor: bgHover,
      boxShadow: underline,
      outline: `2px solid ${alpha(theme.palette.primary.main, 0.35)}`,
      outlineOffset: 2,
    },
  }
}
