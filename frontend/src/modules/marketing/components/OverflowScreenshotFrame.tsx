import { Box, type SxProps, type Theme } from '@mui/material'
import { useEffect, useRef, useState } from 'react'

export type OverflowScreenshotFrameProps = {
  src: string
  alt: string
  /** Hauteur visible du masque (px ou css) */
  frameHeight?: number | string
  /** Durée d’un cycle aller-retour (secondes) */
  durationSec?: number
  /** Fraction du défilement max (0–1) */
  distanceRatio?: number
  /** Délai avant démarrage (secondes) */
  delaySec?: number
  maxWidth?: number | { xs?: number; md?: number }
  sx?: SxProps<Theme>
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

/**
 * Cadre masqué avec défilement vertical automatique (screenshot full-page marketing).
 * Port de docs/marketing/scripts/overflow-frame-demo.html pour les landing pages.
 */
export function OverflowScreenshotFrame({
  src,
  alt,
  frameHeight = 280,
  durationSec = 12,
  distanceRatio = 0.6,
  delaySec = 0,
  maxWidth = { xs: 320, md: 420 },
  sx,
}: OverflowScreenshotFrameProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!ready) return
    const root = rootRef.current
    const viewport = viewportRef.current
    if (!root || !viewport) return

    const img = viewport.querySelector('img')
    if (!img) return

    const duration = durationSec * 1000
    const pause = duration * 0.12
    const move = duration - pause * 2
    let start: number | null = null
    let raf = 0

    const tick = (ts: number) => {
      const frameH = root.clientHeight
      const imgH = img.naturalHeight * (root.clientWidth / img.naturalWidth)
      const maxScroll = Math.max(0, imgH - frameH)
      const travel = maxScroll * distanceRatio

      if (travel < 8) return

      if (!start) start = ts
      const elapsed = ts - start
      let y = 0
      const to = -travel

      if (elapsed < pause) y = 0
      else if (elapsed < pause + move) {
        const t = (elapsed - pause) / move
        y = to * easeInOut(t)
      } else if (elapsed < duration) y = to
      else {
        start = ts
        y = 0
      }

      viewport.style.transform = `translate3d(0, ${y}px, 0)`
      raf = requestAnimationFrame(tick)
    }

    const timeout = window.setTimeout(() => {
      raf = requestAnimationFrame(tick)
    }, delaySec * 1000)

    return () => {
      window.clearTimeout(timeout)
      cancelAnimationFrame(raf)
    }
  }, [ready, durationSec, distanceRatio, delaySec])

  return (
    <Box
      ref={rootRef}
      sx={{
        width: '100%',
        maxWidth,
        height: frameHeight,
        mx: 'auto',
        borderRadius: 3,
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        boxShadow: '0 24px 48px rgba(13, 27, 42, 0.12)',
        bgcolor: 'background.paper',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 48,
          background: (t) =>
            `linear-gradient(transparent, ${t.palette.background.paper})`,
          pointerEvents: 'none',
          zIndex: 1,
        },
        ...sx,
      }}
    >
      <Box
        ref={viewportRef}
        sx={{ width: '100%', willChange: 'transform' }}
      >
        <Box
          component="img"
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setReady(true)}
          sx={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </Box>
    </Box>
  )
}
