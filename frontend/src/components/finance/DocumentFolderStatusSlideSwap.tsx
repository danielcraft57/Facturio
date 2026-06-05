import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Box } from '@mui/material'
import {
  DOCUMENT_FOLDER_STATUS_ENTER_DELAY_MS,
  DOCUMENT_FOLDER_STATUS_SWAP_MS,
  getDocumentFolderRowMotionClipSx,
  getDocumentFolderStatusMotionSx,
} from './documentFolderRailMotion'

type Props = {
  statusKey: string
  children: ReactNode
  minHeight?: number | string
  width?: number | string
  align?: 'center' | 'flex-start' | 'stretch'
  /** Pastille rail : fenêtre alignée sur la colonne 44px, pastille non coupée. */
  variant?: 'default' | 'rail'
}

/**
 * Ancien et nouveau glissent tous les deux vers la droite.
 * Le nouveau part de la gauche ; un léger blanc reste visible entre les deux.
 */
export function DocumentFolderStatusSlideSwap({
  statusKey,
  children,
  minHeight = 'auto',
  width,
  align = 'center',
  variant = 'default',
}: Props) {
  const prevKeyRef = useRef(statusKey)
  const lastStableRef = useRef<ReactNode>(children)
  const [swapping, setSwapping] = useState(false)
  const [outgoing, setOutgoing] = useState<ReactNode | null>(null)

  if (prevKeyRef.current === statusKey && !swapping) {
    lastStableRef.current = children
  }

  useLayoutEffect(() => {
    if (prevKeyRef.current === statusKey) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      prevKeyRef.current = statusKey
      return
    }

    setOutgoing(lastStableRef.current)
    setSwapping(true)
    prevKeyRef.current = statusKey

    const endTimer = window.setTimeout(() => {
      setSwapping(false)
      setOutgoing(null)
    }, DOCUMENT_FOLDER_STATUS_SWAP_MS)

    return () => window.clearTimeout(endTimer)
  }, [statusKey])

  const isRail = variant === 'rail'
  const slotWidth = width ?? (isRail ? RAIL_VIEWPORT : '100%')
  const slotHeight = minHeight ?? (isRail ? RAIL_VIEWPORT : 'auto')

  const layerSx = {
    position: 'absolute' as const,
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: isRail ? 'center' : 'flex-start',
    pointerEvents: 'none' as const,
  }

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'visible',
        minHeight: slotHeight,
        width: slotWidth,
        maxWidth: '100%',
        mx: isRail ? 'auto' : undefined,
        display: 'flex',
        alignItems: align,
        justifyContent: isRail ? 'center' : 'flex-start',
        flexShrink: 0,
        ...(swapping
          ? {
              bgcolor: 'background.paper',
              ...getDocumentFolderRowMotionClipSx(true),
            }
          : {}),
      }}
    >
      {swapping && outgoing != null && (
        <Box sx={[layerSx, { zIndex: 2 }, getDocumentFolderStatusMotionSx('exit')]}>
          {outgoing}
        </Box>
      )}
      {swapping ? (
        <Box
          sx={[
            layerSx,
            { zIndex: 1 },
            getDocumentFolderStatusMotionSx('enter', {
              enterDelayMs: DOCUMENT_FOLDER_STATUS_ENTER_DELAY_MS,
            }),
          ]}
        >
          {children}
        </Box>
      ) : (
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isRail ? 'center' : 'flex-start',
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  )
}

/** Colonne rail : 44px pour ne pas couper la pastille 36px + halo. */
const RAIL_VIEWPORT = 44
