import { Box, type SxProps, type Theme, useMediaQuery, useTheme } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'

export type ResponsiveFrameHeight = number | { xs?: number; sm?: number; md?: number; lg?: number }

export type OverflowScreenshotFrameProps = {
  src: string
  alt: string
  /** Hauteur max visible du masque (px) — s'adapte à la largeur réelle de l'image */
  frameHeight?: ResponsiveFrameHeight
  /** Durée d'un cycle aller-retour (secondes) */
  durationSec?: number
  /** Fraction du défilement max (0–1) */
  distanceRatio?: number
  /** Délai avant démarrage (secondes) */
  delaySec?: number
  maxWidth?: number | string | { xs?: number | string; md?: number | string }
  /** Ouvre la lightbox au clic */
  onOpenLightbox?: () => void
  sx?: SxProps<Theme>
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

/** Résout une hauteur responsive selon les breakpoints MUI actifs. */
function resolveFrameHeight(
  value: ResponsiveFrameHeight,
  matches: { sm: boolean; md: boolean; lg: boolean },
): number {
  if (typeof value === 'number') return value
  if (matches.lg && value.lg != null) return value.lg
  if (matches.md && value.md != null) return value.md
  if (matches.sm && value.sm != null) return value.sm
  return value.xs ?? 240
}

/**
 * Cadre masqué avec défilement vertical automatique (screenshot full-page marketing).
 * La hauteur visible épouse l'image (pas de bande blanche) jusqu'à la hauteur max.
 */
export function OverflowScreenshotFrame({
  src,
  alt,
  frameHeight = { xs: 220, sm: 248, md: 264, lg: 280 },
  durationSec = 12,
  distanceRatio = 0.6,
  delaySec = 0,
  maxWidth = '100%',
  onOpenLightbox,
  sx,
}: OverflowScreenshotFrameProps) {
  const theme = useTheme()
  const upSm = useMediaQuery(theme.breakpoints.up('sm'))
  const upMd = useMediaQuery(theme.breakpoints.up('md'))
  const upLg = useMediaQuery(theme.breakpoints.up('lg'))

  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [visibleHeight, setVisibleHeight] = useState<number | null>(null)
  const [scrollable, setScrollable] = useState(false)

  const maxFrameHeight = resolveFrameHeight(frameHeight, {
    sm: upSm,
    md: upMd,
    lg: upLg,
  })

  const measure = useCallback(() => {
    const root = rootRef.current
    const img = viewportRef.current?.querySelector('img') as HTMLImageElement | null
    if (!root || !img?.naturalWidth) return

    const width = root.clientWidth
    if (width <= 0) return

    const scaledHeight = img.naturalHeight * (width / img.naturalWidth)
    const height = Math.min(scaledHeight, maxFrameHeight)
    setVisibleHeight(Math.max(1, Math.round(height)))
    setScrollable(scaledHeight > maxFrameHeight + 8)
  }, [maxFrameHeight])

  useEffect(() => {
    if (!ready) return
    measure()
    const root = rootRef.current
    if (!root) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(root)
    return () => observer.disconnect()
  }, [ready, measure])

  useEffect(() => {
    if (!ready || !scrollable) return
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
      viewport.style.transform = ''
    }
  }, [ready, scrollable, durationSec, distanceRatio, delaySec, visibleHeight])

  const placeholderHeight = maxFrameHeight

  return (
    <Box
      ref={rootRef}
      role={onOpenLightbox ? 'button' : undefined}
      tabIndex={onOpenLightbox ? 0 : undefined}
      aria-label={onOpenLightbox ? `Agrandir : ${alt}` : undefined}
      onClick={onOpenLightbox}
      onKeyDown={
        onOpenLightbox
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpenLightbox()
              }
            }
          : undefined
      }
      sx={{
        width: '100%',
        maxWidth,
        height: visibleHeight ?? placeholderHeight,
        mx: 'auto',
        borderRadius: { xs: 2, md: 3 },
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        boxShadow: {
          xs: '0 12px 28px rgba(13, 27, 42, 0.1)',
          md: '0 24px 48px rgba(13, 27, 42, 0.12)',
        },
        bgcolor: 'grey.100',
        position: 'relative',
        cursor: onOpenLightbox ? 'zoom-in' : 'default',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        ...(onOpenLightbox
          ? {
              '&:hover': {
                boxShadow: {
                  xs: '0 16px 36px rgba(13, 27, 42, 0.16)',
                  md: '0 28px 56px rgba(13, 27, 42, 0.18)',
                },
                '& .screenshot-zoom-hint': { opacity: 1 },
              },
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 2,
              },
            }
          : {}),
        ...(scrollable
          ? {
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: 36,
                background: (t) =>
                  `linear-gradient(transparent, ${t.palette.grey[100]})`,
                pointerEvents: 'none',
                zIndex: 1,
              },
            }
          : {}),
        ...sx,
      }}
    >
      {onOpenLightbox && (
        <Box
          className="screenshot-zoom-hint"
          aria-hidden
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: 'common.white',
            bgcolor: 'rgba(15, 23, 42, 0.55)',
            opacity: { xs: 1, md: 0 },
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
          }}
        >
          Agrandir
        </Box>
      )}
      <Box
        ref={viewportRef}
        sx={{ width: '100%', willChange: scrollable ? 'transform' : 'auto' }}
      >
        <Box
          component="img"
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => {
            setReady(true)
          }}
          sx={{ display: 'block', width: '100%', height: 'auto', verticalAlign: 'top' }}
        />
      </Box>
    </Box>
  )
}
