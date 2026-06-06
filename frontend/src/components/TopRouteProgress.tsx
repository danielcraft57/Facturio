import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Box, alpha, useTheme } from '@mui/material'
import { useLocation } from 'react-router-dom'
import {
  resolveRouteTransition,
  routeTransitionDurationMs,
  type RouteTransitionKind,
} from '../utils/routeTransition'

/**
 * Barre de progression fixe en haut de l’écran (style NProgress / GitHub).
 * Affichée à chaque changement de route + scroll en haut de page.
 */
export function TopRouteProgress() {
  const theme = useTheme()
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const timersRef = useRef<number[]>([])
  const previousPathRef = useRef<string | null>(null)
  const lastTransitionKindRef = useRef<RouteTransitionKind>('full')

  useLayoutEffect(() => {
    const kind = resolveRouteTransition(previousPathRef.current, location.pathname)
    lastTransitionKindRef.current = kind
    if (kind !== 'none') {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    previousPathRef.current = location.pathname
  }, [location.pathname, location.search, location.key])

  useEffect(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []

    const minVisibleMs = routeTransitionDurationMs(lastTransitionKindRef.current)
    if (minVisibleMs <= 0) {
      setVisible(false)
      setProgress(0)
      return
    }

    setVisible(true)
    setProgress(8)

    const start = performance.now()
    let raf = 0

    const animate = (now: number) => {
      const elapsed = now - start
      const ratio = Math.min(elapsed / minVisibleMs, 1)
      const eased = 1 - Math.pow(1 - ratio, 2.5)
      setProgress(8 + eased * 82)
      if (ratio < 1) {
        raf = requestAnimationFrame(animate)
      }
    }

    raf = requestAnimationFrame(animate)

    const finish = window.setTimeout(() => {
      setProgress(100)
      const hide = window.setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 180)
      timersRef.current.push(hide)
    }, minVisibleMs)

    timersRef.current.push(finish)

    return () => {
      cancelAnimationFrame(raf)
      timersRef.current.forEach((id) => window.clearTimeout(id))
      timersRef.current = []
    }
  }, [location.pathname, location.search, location.key])

  if (!visible && progress === 0) return null

  return (
    <Box
      role="progressbar"
      aria-hidden
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.tooltip + 2,
        height: 3,
        pointerEvents: 'none',
        bgcolor: (t) => alpha(t.palette.divider, 0.4),
      }}
    >
      <Box
        sx={{
          height: '100%',
          width: `${progress}%`,
          bgcolor: 'primary.main',
          boxShadow: (t) => `0 0 8px ${alpha(t.palette.primary.main, 0.45)}`,
          transition: progress >= 100 ? 'width 0.2s ease-out' : 'width 0.12s linear',
        }}
      />
    </Box>
  )
}
