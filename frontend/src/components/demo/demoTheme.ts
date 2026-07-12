import { alpha, keyframes } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'

/**
 * Palette inspirée de Tron : L'héritage — vide sombre, néons cyan, accent ambre (Clu).
 * @see https://en.wikipedia.org/wiki/Tron:_Legacy
 */
export const DEMO_HERO_GRADIENT =
  'linear-gradient(135deg, #020617 0%, #002a45 42%, #006494 78%, #00d4ff 100%)'

export const DEMO_HERO_COLORS = {
  /** Fond grille / void */
  deep: '#020617',
  /** Néon cyan principal */
  main: '#00D4FF',
  /** Reflet bord lumineux */
  bright: '#5CE1FF',
  /** Ambre Clu — badges, alertes chaudes */
  accent: '#FF9F1C',
  glow: 'rgba(0, 212, 255, 0.55)',
  text: '#E8FAFF',
  /** Texte lisible sur fond clair (app MUI light) */
  ink: '#00455A',
} as const

/** Quêtes compte réel — teal produit (distinct de l'esthétique Tron démo). */
export const QUEST_COLORS = {
  deep: '#134e4a',
  main: '#0d9488',
  bright: '#0f766e',
  accent: '#14b8a6',
  glow: 'rgba(13, 148, 136, 0.45)',
  text: '#ecfdf5',
  ink: '#115e59',
} as const

export const QUEST_GRADIENT =
  'linear-gradient(135deg, #0f766e 0%, #0d9488 42%, #134e4a 100%)'

export const QUEST_NEON_GRADIENT =
  'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #5eead4 100%)'

/** Dégradé boutons / pastilles actives (cyan pur). */
export const DEMO_NEON_GRADIENT =
  'linear-gradient(135deg, #0077b6 0%, #00b4d8 45%, #48cae4 100%)'

/** Pop micro-animation quand une étape de quête est validée. */
export const questStepPop = keyframes`
  0% { transform: scale(0.92); opacity: 0.6; box-shadow: 0 0 0 rgba(0, 212, 255, 0); }
  55% { transform: scale(1.04); opacity: 1; box-shadow: 0 0 20px rgba(0, 212, 255, 0.35); }
  100% { transform: scale(1); opacity: 1; box-shadow: 0 0 8px rgba(0, 212, 255, 0.2); }
`

/** Entrée « mission accomplie » (dialogs, bandeaux). */
export const questMissionReveal = keyframes`
  0% { opacity: 0; transform: translateY(12px) scale(0.97); filter: brightness(0.85); }
  100% { opacity: 1; transform: translateY(0) scale(1); filter: brightness(1); }
`

/** Styles HUD démo (Tron). */
export function demoHudSurfaceSx(mode: 'light' | 'dark' = 'light') {
  const isDark = mode === 'dark'
  return {
    background: isDark
      ? `linear-gradient(145deg, ${alpha(DEMO_HERO_COLORS.deep, 0.92)} 0%, ${alpha('#003049', 0.88)} 100%)`
      : `linear-gradient(145deg, ${alpha(DEMO_HERO_COLORS.deep, 0.04)} 0%, ${alpha(DEMO_HERO_COLORS.main, 0.06)} 100%)`,
    border: '1px solid',
    borderColor: alpha(DEMO_HERO_COLORS.main, isDark ? 0.5 : 0.35),
    boxShadow: isDark
      ? `0 0 28px ${alpha(DEMO_HERO_COLORS.main, 0.2)}, inset 0 1px 0 ${alpha(DEMO_HERO_COLORS.bright, 0.12)}`
      : `0 0 20px ${alpha(DEMO_HERO_COLORS.main, 0.12)}, inset 0 1px 0 ${alpha(DEMO_HERO_COLORS.bright, 0.25)}`,
  }
}

/**
 * Surface carte HUD quête activation (teal produit).
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
 * Bandeau démo pleine largeur (Alert) — strip sombre type grille Tron.
 */
export function demoBannerSurfaceSx(): SxProps<Theme> {
  return {
    alignItems: 'center',
    color: DEMO_HERO_COLORS.text,
    background: `linear-gradient(90deg, ${alpha(DEMO_HERO_COLORS.deep, 0.96)} 0%, ${alpha('#003049', 0.92)} 55%, ${alpha(DEMO_HERO_COLORS.main, 0.12)} 100%)`,
    border: `1px solid ${alpha(DEMO_HERO_COLORS.main, 0.42)}`,
    boxShadow: `0 0 24px ${alpha(DEMO_HERO_COLORS.main, 0.14)}`,
    '& .MuiAlert-icon': { color: DEMO_HERO_COLORS.main },
    '& .MuiAlert-message': { color: DEMO_HERO_COLORS.text },
  }
}

/**
 * Barre de progression quête démo (néon Tron).
 */
export function demoProgressBarSx(): SxProps<Theme> {
  return {
    height: 8,
    borderRadius: 4,
    bgcolor: alpha(DEMO_HERO_COLORS.main, 0.14),
    '& .MuiLinearProgress-bar': {
      borderRadius: 4,
      background: DEMO_NEON_GRADIENT,
      boxShadow: `0 0 14px ${DEMO_HERO_COLORS.glow}`,
    },
  }
}

/**
 * Chip compteur démo (Tron).
 */
export function demoBadgeChipSx(): SxProps<Theme> {
  return {
    fontWeight: 800,
    letterSpacing: '0.04em',
    bgcolor: alpha(DEMO_HERO_COLORS.main, 0.14),
    color: DEMO_HERO_COLORS.ink,
    border: `1px solid ${alpha(DEMO_HERO_COLORS.main, 0.35)}`,
  }
}

/**
 * Ligne d'étape quête démo (Tron).
 */
export function demoStepRowSx(isNext: boolean, completed: boolean): SxProps<Theme> {
  return {
    borderRadius: 1.5,
    px: 1,
    py: 0.75,
    border: '1px solid',
    borderColor: isNext ? alpha(DEMO_HERO_COLORS.main, 0.55) : 'transparent',
    bgcolor: isNext ? alpha(DEMO_HERO_COLORS.main, 0.1) : 'transparent',
    boxShadow: isNext ? `0 0 18px ${alpha(DEMO_HERO_COLORS.main, 0.22)}` : 'none',
    animation: isNext ? `${questStepPop} 0.45s ease-out` : 'none',
    '&:hover': completed ? undefined : { bgcolor: alpha(DEMO_HERO_COLORS.main, 0.12) },
  }
}

/**
 * Pastille étape démo (Tron).
 */
export function demoStepBulletSx(completed: boolean, isNext: boolean): SxProps<Theme> {
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
    color: completed || isNext ? DEMO_HERO_COLORS.deep : 'text.secondary',
    background:
      completed || isNext
        ? DEMO_NEON_GRADIENT
        : (theme) => alpha(theme.palette.text.primary, 0.08),
    boxShadow: completed || isNext ? `0 0 10px ${alpha(DEMO_HERO_COLORS.main, 0.45)}` : 'none',
  }
}

/** Bouton outline démo (Tron). */
export function demoCtaOutlinedSx(): SxProps<Theme> {
  return {
    alignSelf: 'flex-start',
    borderColor: alpha(DEMO_HERO_COLORS.main, 0.5),
    color: DEMO_HERO_COLORS.ink,
    fontWeight: 700,
    '&:hover': {
      borderColor: DEMO_HERO_COLORS.main,
      bgcolor: alpha(DEMO_HERO_COLORS.main, 0.08),
      boxShadow: `0 0 12px ${alpha(DEMO_HERO_COLORS.main, 0.2)}`,
    },
  }
}

/**
 * Barre de progression quête (démo / activation).
 */
export function questProgressBarSx(): SxProps<Theme> {
  return {
    height: 8,
    borderRadius: 4,
    bgcolor: alpha(QUEST_COLORS.main, 0.14),
    '& .MuiLinearProgress-bar': {
      borderRadius: 4,
      background: QUEST_NEON_GRADIENT,
      boxShadow: `0 0 14px ${QUEST_COLORS.glow}`,
    },
  }
}

/**
 * Chip compteur d'étapes (ex. 2/3).
 */
export function questBadgeChipSx(): SxProps<Theme> {
  return {
    fontWeight: 800,
    letterSpacing: '0.04em',
    bgcolor: alpha(QUEST_COLORS.main, 0.14),
    color: QUEST_COLORS.ink,
    border: `1px solid ${alpha(QUEST_COLORS.main, 0.35)}`,
  }
}

/**
 * Chip « MODE DÉMO » — accent ambre Tron.
 */
export function demoModeChipSx(): SxProps<Theme> {
  return {
    fontWeight: 800,
    letterSpacing: '0.08em',
    height: 22,
    bgcolor: alpha(DEMO_HERO_COLORS.accent, 0.22),
    color: DEMO_HERO_COLORS.accent,
    border: `1px solid ${alpha(DEMO_HERO_COLORS.accent, 0.55)}`,
    boxShadow: `0 0 10px ${alpha(DEMO_HERO_COLORS.accent, 0.25)}`,
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
    borderColor: isNext ? alpha(QUEST_COLORS.main, 0.55) : 'transparent',
    bgcolor: isNext ? alpha(QUEST_COLORS.main, 0.1) : 'transparent',
    boxShadow: isNext ? `0 0 18px ${alpha(QUEST_COLORS.main, 0.22)}` : 'none',
    animation: isNext ? `${questStepPop} 0.45s ease-out` : 'none',
    '&:hover': completed ? undefined : { bgcolor: alpha(QUEST_COLORS.main, 0.12) },
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
    color: completed || isNext ? QUEST_COLORS.deep : 'text.secondary',
    background:
      completed || isNext
        ? QUEST_NEON_GRADIENT
        : (theme) => alpha(theme.palette.text.primary, 0.08),
    boxShadow: completed || isNext ? `0 0 10px ${alpha(QUEST_COLORS.main, 0.45)}` : 'none',
  }
}

/** Bouton CTA secondaire quête (outline néon). */
export function questCtaOutlinedSx(): SxProps<Theme> {
  return {
    alignSelf: 'flex-start',
    borderColor: alpha(QUEST_COLORS.main, 0.5),
    color: QUEST_COLORS.ink,
    fontWeight: 700,
    '&:hover': {
      borderColor: QUEST_COLORS.main,
      bgcolor: alpha(QUEST_COLORS.main, 0.08),
      boxShadow: `0 0 12px ${alpha(QUEST_COLORS.main, 0.2)}`,
    },
  }
}

/** Conteneur dialog « mission terminée » (activation). */
export function questMissionPanelSx(): SxProps<Theme> {
  return {
    p: 2,
    borderRadius: 2,
    border: '1px solid',
    borderColor: alpha(QUEST_COLORS.main, 0.4),
    background: `linear-gradient(135deg, ${alpha(QUEST_COLORS.deep, 0.06)} 0%, ${alpha(QUEST_COLORS.main, 0.1)} 100%)`,
    boxShadow: `inset 0 1px 0 ${alpha(QUEST_COLORS.bright, 0.2)}`,
    animation: `${questMissionReveal} 0.5s ease-out`,
  }
}

/** Conteneur récap mission démo (Tron). */
export function demoMissionPanelSx(): SxProps<Theme> {
  return {
    p: 2,
    borderRadius: 2,
    border: '1px solid',
    borderColor: alpha(DEMO_HERO_COLORS.main, 0.4),
    background: `linear-gradient(135deg, ${alpha(DEMO_HERO_COLORS.deep, 0.08)} 0%, ${alpha(DEMO_HERO_COLORS.main, 0.12)} 100%)`,
    boxShadow: `inset 0 1px 0 ${alpha(DEMO_HERO_COLORS.bright, 0.22)}`,
    animation: `${questMissionReveal} 0.5s ease-out`,
  }
}

/** Bouton primaire gradient néon Tron. */
export function questPrimaryButtonSx(): SxProps<Theme> {
  return {
    fontWeight: 700,
    color: QUEST_COLORS.deep,
    background: QUEST_NEON_GRADIENT,
    boxShadow: `0 0 16px ${alpha(QUEST_COLORS.main, 0.35)}`,
    '&:hover': {
      background: QUEST_NEON_GRADIENT,
      filter: 'brightness(1.08)',
      boxShadow: `0 0 22px ${alpha(QUEST_COLORS.main, 0.45)}`,
    },
  }
}

/** Bouton primaire néon Tron (bandeau et dialogs démo). */
export function demoBannerButtonSx(): SxProps<Theme> {
  return {
    fontWeight: 700,
    whiteSpace: 'nowrap',
    color: DEMO_HERO_COLORS.deep,
    background: DEMO_NEON_GRADIENT,
    boxShadow: `0 0 14px ${alpha(DEMO_HERO_COLORS.main, 0.4)}`,
    '&:hover': {
      background: DEMO_NEON_GRADIENT,
      filter: 'brightness(1.08)',
    },
  }
}

/** Alias sémantique pour les CTA dialogs démo. */
export function demoPrimaryButtonSx(): SxProps<Theme> {
  return demoBannerButtonSx()
}
