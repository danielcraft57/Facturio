import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import {
  Box,
  Dialog,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'

export type ScreenshotLightboxItem = {
  src: string
  label: string
  alt: string
}

type ScreenshotLightboxProps = {
  open: boolean
  items: ScreenshotLightboxItem[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

/**
 * Lightbox plein écran pour parcourir et zoomer les captures marketing.
 */
export function ScreenshotLightbox({
  open,
  items,
  index,
  onClose,
  onIndexChange,
}: ScreenshotLightboxProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [zoomed, setZoomed] = useState(false)

  const item = items[index]
  const hasPrev = index > 0
  const hasNext = index < items.length - 1

  const goPrev = useCallback(() => {
    if (hasPrev) onIndexChange(index - 1)
  }, [hasPrev, index, onIndexChange])

  const goNext = useCallback(() => {
    if (hasNext) onIndexChange(index + 1)
  }, [hasNext, index, onIndexChange])

  useEffect(() => {
    if (!open) {
      setZoomed(false)
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, goPrev, goNext])

  useEffect(() => {
    setZoomed(false)
  }, [index])

  if (!item) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'rgba(15, 23, 42, 0.96)',
            backgroundImage: 'none',
            m: fullScreen ? 0 : 2,
            width: fullScreen ? '100%' : 'min(1200px, calc(100vw - 32px))',
            maxHeight: fullScreen ? '100%' : 'calc(100vh - 32px)',
            height: fullScreen ? '100%' : 'calc(100vh - 32px)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: fullScreen ? 0 : 2,
            overflow: 'hidden',
          },
        },
        backdrop: {
          sx: { bgcolor: 'rgba(15, 23, 42, 0.88)' },
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: { xs: 1, sm: 2 },
          py: 1,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        <Typography
          variant="subtitle1"
          component="h2"
          sx={{ color: 'common.white', fontWeight: 600, pl: { xs: 0.5, sm: 0 } }}
        >
          {item.label}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <IconButton
            aria-label={zoomed ? "Ajuster a l'ecran" : 'Zoomer'}
            onClick={() => setZoomed((z) => !z)}
            sx={{ color: 'common.white' }}
          >
            {zoomed ? <ZoomOutIcon /> : <ZoomInIcon />}
          </IconButton>
          <IconButton aria-label="Fermer" onClick={onClose} sx={{ color: 'common.white' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: zoomed ? 'flex-start' : 'center',
          justifyContent: 'center',
          overflow: 'auto',
          p: { xs: 1.5, sm: 2 },
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {hasPrev && (
          <IconButton
            aria-label="Capture précédente"
            onClick={goPrev}
            sx={{
              position: 'absolute',
              left: { xs: 4, sm: 12 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              color: 'common.white',
              bgcolor: 'rgba(255,255,255,0.12)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}

        <Box
          component="img"
          src={item.src}
          alt={item.alt}
          onClick={() => setZoomed((z) => !z)}
          sx={{
            display: 'block',
            borderRadius: 1.5,
            boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
            cursor: 'zoom-in',
            ...(zoomed
              ? {
                  width: { xs: '140%', sm: '120%' },
                  maxWidth: 'none',
                  height: 'auto',
                  cursor: 'zoom-out',
                }
              : {
                  maxWidth: '100%',
                  maxHeight: { xs: 'calc(100vh - 140px)', sm: 'calc(100vh - 160px)' },
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                }),
          }}
        />

        {hasNext && (
          <IconButton
            aria-label="Capture suivante"
            onClick={goNext}
            sx={{
              position: 'absolute',
              right: { xs: 4, sm: 12 },
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              color: 'common.white',
              bgcolor: 'rgba(255,255,255,0.12)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        )}
      </Box>

      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255,255,255,0.65)',
          textAlign: 'center',
          py: 1,
          px: 2,
          flexShrink: 0,
        }}
      >
        {index + 1} / {items.length}
        {!fullScreen ? ' — Échap pour fermer, flèches pour naviguer' : ' — Pincer ou faire défiler en mode zoom'}
      </Typography>
    </Dialog>
  )
}
