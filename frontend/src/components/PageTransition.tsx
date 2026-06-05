import type { ReactNode } from 'react'
import { useRef } from 'react'
import { Box, keyframes } from '@mui/material'
import { useLocation } from 'react-router-dom'
import {
  resolveRouteTransition,
  routeTransitionDurationMs,
  type RouteTransitionKind,
} from '../utils/routeTransition'

type PageTransitionProps = {
  children: ReactNode
}

const pageEnterFull = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const pageEnterSoft = keyframes`
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const ANIMATION_BY_KIND: Record<Exclude<RouteTransitionKind, 'none'>, ReturnType<typeof keyframes>> = {
  soft: pageEnterSoft,
  full: pageEnterFull,
}

/**
 * Transition entre pages : fondu + léger glissement.
 * Changement de dossier sidebar (inbox → envoyés) : pas d’animation ici (shell liste).
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const previousPathRef = useRef<string | null>(null)
  const kind = resolveRouteTransition(previousPathRef.current, location.pathname)
  previousPathRef.current = location.pathname

  const routeKey = `${location.pathname}${location.search}`

  if (kind === 'none') {
    return <Box sx={{ width: '100%' }}>{children}</Box>
  }

  const durationSec = routeTransitionDurationMs(kind) / 1000
  const animation = ANIMATION_BY_KIND[kind]

  return (
    <Box
      key={routeKey}
      sx={{
        width: '100%',
        willChange: 'opacity, transform',
        animation: `${animation} ${durationSec}s cubic-bezier(0.22, 1, 0.36, 1) both`,
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'none',
        },
      }}
    >
      {children}
    </Box>
  )
}
