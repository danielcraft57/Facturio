import { keyframes } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'

export type DocumentFolderRowMotion = 'enter' | 'exit'
export type DocumentFolderStatusMotion = 'enter' | 'exit'

/** Durée du glissement de ligne (archivage / création). */
export const DOCUMENT_FOLDER_RAIL_EXIT_MS = 1150
export const DOCUMENT_FOLDER_RAIL_ENTER_MS = 1050

/** Glissement statut : gauche → droite, avec interstice blanc entre ancien et nouveau. */
export const DOCUMENT_FOLDER_STATUS_GAP_PX = 10
export const DOCUMENT_FOLDER_STATUS_ENTER_MS = 520
/** Le nouveau démarre pendant que l’ancien glisse encore (trou blanc visible entre les deux). */
export const DOCUMENT_FOLDER_STATUS_ENTER_DELAY_MS = 200
export const DOCUMENT_FOLDER_STATUS_SWAP_MS =
  DOCUMENT_FOLDER_STATUS_ENTER_DELAY_MS + DOCUMENT_FOLDER_STATUS_ENTER_MS
/** L’ancien glisse sur toute la durée du swap pour garder le même sens gauche → droite. */
export const DOCUMENT_FOLDER_STATUS_EXIT_MS = DOCUMENT_FOLDER_STATUS_SWAP_MS

const EASE_OUT_SMOOTH = 'cubic-bezier(0.33, 1, 0.68, 1)'
const EASE_ENTER = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** Archivage : glissement vers la droite — hauteur de ligne inchangée. */
export const rowExitSlide = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(calc(100% + 20px));
    opacity: 0;
  }
`

const cardExitSlide = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(calc(100% + 20px));
    opacity: 0;
  }
`

/** Statut : ancien et nouveau glissent vers la droite ; le nouveau part de la gauche. */
export const statusExitRight = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(calc(100% + ${DOCUMENT_FOLDER_STATUS_GAP_PX}px));
    opacity: 1;
  }
`

export const statusEnterFromLeft = keyframes`
  from {
    transform: translateX(calc(-100% - ${DOCUMENT_FOLDER_STATUS_GAP_PX}px));
    opacity: 1;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`

/** Création : arrive de la droite. */
export const rowEnterFromRight = keyframes`
  from {
    transform: translateX(calc(100% + 20px));
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`

const rowMotionBaseSx = {
  pointerEvents: 'none' as const,
  overflow: 'hidden',
  willChange: 'transform, opacity',
}

const statusMotionBaseSx = {
  pointerEvents: 'none' as const,
  overflow: 'visible',
  willChange: 'transform, opacity',
}

export type DocumentFolderRowMotionLayout = 'table' | 'card'

export function getDocumentFolderRowMotionSx(
  motion?: DocumentFolderRowMotion,
  layout: DocumentFolderRowMotionLayout = 'table',
): SxProps<Theme> {
  if (!motion) return {}

  if (motion === 'exit') {
    const slideAnim = `${rowExitSlide} ${DOCUMENT_FOLDER_RAIL_EXIT_MS}ms ${EASE_OUT_SMOOTH} forwards`
    const cardAnim = `${cardExitSlide} ${DOCUMENT_FOLDER_RAIL_EXIT_MS}ms ${EASE_OUT_SMOOTH} forwards`

    return {
      '@media (prefers-reduced-motion: no-preference)': {
        ...rowMotionBaseSx,
        animation: layout === 'card' ? cardAnim : slideAnim,
      },
    }
  }

  return {
    '@media (prefers-reduced-motion: no-preference)': {
      overflow: 'visible',
      willChange: 'transform, opacity',
      animation: `${rowEnterFromRight} ${DOCUMENT_FOLDER_RAIL_ENTER_MS}ms ${EASE_ENTER} both`,
    },
  }
}

/** Glissement statut : sortie et entrée vers la droite, interstice blanc entre les deux. */
export function getDocumentFolderStatusMotionSx(
  motion?: DocumentFolderStatusMotion,
  opts?: { enterDelayMs?: number },
): SxProps<Theme> {
  if (!motion) return {}

  if (motion === 'exit') {
    return {
      '@media (prefers-reduced-motion: no-preference)': {
        ...statusMotionBaseSx,
        animation: `${statusExitRight} ${DOCUMENT_FOLDER_STATUS_EXIT_MS}ms ${EASE_OUT_SMOOTH} forwards`,
      },
    }
  }

  const delay = opts?.enterDelayMs ?? 0

  return {
    '@media (prefers-reduced-motion: no-preference)': {
      ...statusMotionBaseSx,
      animation: `${statusEnterFromLeft} ${DOCUMENT_FOLDER_STATUS_ENTER_MS}ms ${EASE_ENTER} ${delay}ms both`,
    },
  }
}

/** Masque le débordement horizontal pendant les animations de ligne (évite la scrollbar). */
export function getDocumentFolderRowMotionClipSx(active?: boolean): SxProps<Theme> {
  if (!active) return {}
  return {
    overflow: 'hidden',
    overflowX: 'hidden',
    overflowY: 'hidden',
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
