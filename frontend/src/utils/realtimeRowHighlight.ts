import type { SxProps, Theme } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'
import type { RealtimeHighlightTone } from '../types/realtime'

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 var(--rt-glow); }
  40% { box-shadow: 0 0 0 8px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
`

const slideIn = keyframes`
  0% { opacity: 0.35; transform: translateX(-6px); }
  100% { opacity: 1; transform: translateX(0); }
`

function toneColor(theme: Theme, tone: RealtimeHighlightTone) {
  switch (tone) {
    case 'created':
      return theme.palette.success.main
    case 'sent':
      return theme.palette.info.main
    case 'paid':
      return theme.palette.success.dark
    case 'deleted':
      return theme.palette.error.main
    default:
      return theme.palette.warning.main
  }
}

export function getRealtimeRowSx(tone: RealtimeHighlightTone | undefined): SxProps<Theme> {
  if (!tone) return {}
  return (theme) => {
    const main = toneColor(theme, tone)
    return {
      '--rt-glow': alpha(main, 0.45),
      animation: `${slideIn} 0.45s ease-out, ${pulse} 1.6s ease-out 2`,
      backgroundColor: alpha(main, tone === 'updated' ? 0.1 : 0.16),
      '& > .MuiTableCell-root:first-of-type': {
        borderLeft: `4px solid ${main}`,
      },
      transition: 'background-color 0.6s ease',
    }
  }
}

export function getRealtimePanelSx(tone: RealtimeHighlightTone | undefined): SxProps<Theme> {
  if (!tone) return {}
  return (theme) => {
    const main = toneColor(theme, tone)
    return {
      '--rt-glow': alpha(main, 0.4),
      animation: `${pulse} 1.8s ease-out 1`,
      boxShadow: `0 0 0 2px ${alpha(main, 0.25)}`,
      transition: 'box-shadow 0.5s ease',
    }
  }
}
