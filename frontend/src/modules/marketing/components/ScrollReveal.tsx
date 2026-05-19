import type { PropsWithChildren, CSSProperties } from 'react'
import { Box } from '@mui/material'
import { keyframes } from '@mui/system'
import { useScrollReveal } from '../hooks/useScrollReveal'

const revealUp = keyframes`
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: translateY(0); }
`

const revealScale = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
`

type ScrollRevealProps = PropsWithChildren<{
  delayMs?: number
  variant?: 'up' | 'scale'
  sx?: CSSProperties
}>

export function ScrollReveal({ children, delayMs = 0, variant = 'up', sx }: ScrollRevealProps) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>()

  return (
    <Box
      ref={ref}
      sx={{
        opacity: visible ? 1 : 0,
        animation: visible
          ? `${variant === 'scale' ? revealScale : revealUp} 0.65s cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms both`
          : 'none',
        ...sx,
      }}
    >
      {children}
    </Box>
  )
}
