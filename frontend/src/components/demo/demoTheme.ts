import { alpha, keyframes } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

/** Dégradé hero marketing (pages publiques) — base visuelle mode démo. */
export const DEMO_HERO_GRADIENT =
  'linear-gradient(135deg, #0f766e 0%, #0d9488 42%, #134e4a 100%)'

export const DEMO_HERO_COLORS = {
  deep: '#134e4a',
  main: '#0d9488',
  bright: '#0f766e',
  glow: 'rgba(13, 148, 136, 0.45)',
  text: '#ecfdf5',
} as const

/** Palette quêtes partagée (démo + activation compte). */
export const QUEST_COLORS = DEMO_HERO_COLORS
export const QUEST_GRADIENT = DEMO_HERO_GRADIENT

/** Pop micro-animation quand une étape de quête est validée. */
export const questStepPop = keyframes`
  0% { transform: scale(0.92); opacity: 0.6; }
  55% { transform: scale(1.04); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`

/** Entrée « mission accomplie » (dialogs, bandeaux). */
export const questMissionReveal = keyframes`
  0% { opacity: 0; transform: translateY(12px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`

/** Styles HUD / quête pour cartes et bandeaux. */
export function demoHudSurfaceSx(mode: 'light' | 'dark' = 'light') {
  return questHudSurfaceSx(mode)
}

/**
 * Surface carte HUD quête (démo ou activation).
 *
 * @param mode - Thème clair ou sombre
 */
export function questHudSurfaceSx(mode: 'light' | 'dark' = 'light') {
  const isDark = mode === 'dark'
  return {
    background: isDark
      ? `linear-gradient(145deg, ${alpha(QUEST_COLORS.bright, 0.22)} 0%, ${alpha(QUEST_COLORS.deep, 0.35)} 100%)`
      : `linear-gradient(145deg, ${alpha(QUEST_COLORS.main, 0.08)} 0%, ${alpha(QUEST_COLORS.bright, 0.04)} 100%)`,
    border: '1px solid',
    borderColor: alpha(QUEST_COLORS.main, isDark ? 0.35 : 0.28),
    boxShadow: `0 0 24px ${alpha(QUEST_COLORS.main, isDark ? 0.15 : 0.1)}`,
  }
}

/**
 * Barre de progression quête (démo / activation).
 */
export function questProgressBarSx(): SxProps<Theme> {
  return {
    height: 8,
    borderRadius: 4,
    bgcolor: alpha(QUEST_COLORS.main, 0.12),
    '& .MuiLinearProgress-bar': {
      borderRadius: 4,
      background: QUEST_GRADIENT,
      boxShadow: `0 0 12px ${QUEST_COLORS.glow}`,
    },
  }
}

/**
 * Chip compteur d'étapes (ex. 2/3).
 */
export function questBadgeChipSx(): SxProps<Theme> {
  return {
    fontWeight: 800,
    bgcolor: alpha(QUEST_COLORS.main, 0.12),
    color: QUEST_COLORS.deep,
  }
}

/**
 * Ligne d'étape quête (surbrillance étape courante).
 *
 * @param isNext - Étape active à faire
 * @param completed - Étape déjà validée
 */
export function questStepRowSx(isNext: boolean, completed: boolean): SxProps<Theme> {
  return {
    borderRadius: 1.5,
    px: 1,
    py: 0.75,
    border: '1px solid',
    borderColor: isNext ? alpha(QUEST_COLORS.main, 0.45) : 'transparent',
    bgcolor: isNext ? alpha(QUEST_COLORS.main, 0.08) : 'transparent',
    boxShadow: isNext ? `0 0 16px ${alpha(QUEST_COLORS.main, 0.15)}` : 'none',
    animation: isNext ? `${questStepPop} 0.45s ease-out` : 'none',
    '&:hover': completed ? undefined : { bgcolor: alpha(QUEST_COLORS.main, 0.1) },
  }
}

/**
 * Pastille numéro / check d'une étape.
 */
export function questStepBulletSx(completed: boolean, isNext: boolean): SxProps<Theme> {
  return {
    width: 24,
    height: 24,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 800,
    color: completed || isNext ? '#fff' : 'text.secondary',
    background:
      completed || isNext
        ? QUEST_GRADIENT
        : (theme) => alpha(theme.palette.text.primary, 0.08),
  }
}

/** Bouton CTA secondaire quête (outline emerald). */
export function questCtaOutlinedSx(): SxProps<Theme> {
  return {
    alignSelf: 'flex-start',
    borderColor: alpha(QUEST_COLORS.main, 0.45),
    color: QUEST_COLORS.deep,
    fontWeight: 700,
  }
}

/** Conteneur dialog « mission terminée ». */
export function questMissionPanelSx(): SxProps<Theme> {
  return {
    p: 2,
    borderRadius: 2,
    border: '1px solid',
    borderColor: alpha(QUEST_COLORS.main, 0.35),
    background: `linear-gradient(135deg, ${alpha(QUEST_COLORS.main, 0.08)} 0%, ${alpha(QUEST_COLORS.deep, 0.04)} 100%)`,
    animation: `${questMissionReveal} 0.5s ease-out`,
  }
}

/** Bouton primaire gradient quête. */
export function questPrimaryButtonSx(): SxProps<Theme> {
  return {
    fontWeight: 700,
    background: QUEST_GRADIENT,
    '&:hover': { background: QUEST_GRADIENT, filter: 'brightness(1.05)' },
  }
}
