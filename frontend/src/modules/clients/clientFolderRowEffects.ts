import { alpha, keyframes } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'

const clientFolderRowReveal = keyframes`
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
`

export const getClientFolderRowRevealSx = (index: number): SxProps<Theme> => ({
  '@media (prefers-reduced-motion: no-preference)': {
    animation: `${clientFolderRowReveal} 0.3s cubic-bezier(0.22, 1, 0.36, 1) both`,
    animationDelay: `${Math.min(index, 14) * 34}ms`,
  },
})

/** Survol : fond teinté + pastille qui pulse légèrement. */
export const getClientFolderRowHoverSx = (accent: string): SxProps<Theme> => ({
  transition: 'background-color 0.18s ease',
  '@media (prefers-reduced-motion: no-preference)': {
    '&:hover': {
      bgcolor: (t) => alpha(accent, t.palette.mode === 'dark' ? 0.09 : 0.045),
      '& .document-folder-row-rail-wrap [role="img"]': {
        transform: 'scale(1.1)',
        boxShadow: `0 4px 14px ${alpha(accent, 0.38)}`,
      },
    },
    '& .document-folder-row-rail-wrap [role="img"]': {
      transition: 'transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.22s ease',
    },
  },
})

export const getClientFolderMobileCardSx = (accent: string, index: number): SxProps<Theme> => ({
  borderLeftWidth: 4,
  borderLeftStyle: 'solid',
  borderLeftColor: accent,
  transition: 'transform 0.18s ease, box-shadow 0.2s ease',
  ...getClientFolderRowRevealSx(index),
  '@media (prefers-reduced-motion: no-preference)': {
    '&:active': { transform: 'scale(0.993)' },
    '&:hover': {
      boxShadow: (t) =>
        t.palette.mode === 'dark'
          ? `0 6px 20px ${alpha('#000', 0.35)}`
          : `0 8px 24px ${alpha(accent, 0.12)}`,
      '& .document-folder-row-rail-wrap [role="img"]': {
        transform: 'scale(1.08)',
      },
    },
    '& .document-folder-row-rail-wrap [role="img"]': {
      transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
})
