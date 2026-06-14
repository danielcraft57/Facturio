import { Tooltip } from '@mui/material'
import type { ReactElement, ReactNode } from 'react'

type DisabledActionTooltipProps = {
  /** true si le bouton ou l'action est désactivé(e) */
  disabled: boolean
  /** Texte affiché au survol (ignoré si l'action est active) */
  title: ReactNode
  children: ReactElement
}

/**
 * Infobulle au survol pour les boutons désactivés.
 * MUI ne propage pas le survol sur un élément `disabled` : on enveloppe dans un span.
 */
export function DisabledActionTooltip({ disabled, title, children }: DisabledActionTooltipProps) {
  if (!disabled || title == null || title === '') {
    return children
  }

  return (
    <Tooltip
      title={title}
      arrow
      placement="top"
      slotProps={{
        tooltip: {
          sx: { whiteSpace: 'pre-line', maxWidth: 320 },
        },
      }}
    >
      <span style={{ display: 'block', width: '100%' }}>{children}</span>
    </Tooltip>
  )
}

/**
 * Formate une liste de raisons en texte lisible pour une infobulle.
 *
 * @param reasons - Raisons du blocage
 */
export function formatDisabledReasons(reasons: string[]): string {
  if (reasons.length === 0) return ''
  if (reasons.length === 1) return reasons[0]
  return reasons.map((reason) => `• ${reason}`).join('\n')
}
