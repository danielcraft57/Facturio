import type { ReactNode } from 'react'
import { Button, Tooltip, type ButtonProps } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DEMO_CREATE_HINT, useDemoMode } from '../../hooks/useDemoMode'

type DemoRestrictedCreateButtonProps = Omit<ButtonProps, 'onClick'> & {
  label: string
  onCreate: () => void
  /** Appelé après navigation mobile (fermeture drawer). */
  onAfterClick?: () => void
  startIcon?: ReactNode
}

/**
 * Bouton « Nouveau … » : en démo ouvre l'aperçu interactif (enregistrement bloqué au submit).
 */
export function DemoRestrictedCreateButton({
  label,
  onCreate,
  onAfterClick,
  startIcon = <AddIcon />,
  ...buttonProps
}: DemoRestrictedCreateButtonProps) {
  const isDemo = useDemoMode()

  const handleClick = () => {
    onCreate()
    onAfterClick?.()
  }

  const displayLabel = isDemo ? `Aperçu : ${label.replace(/^Nouveau /i, '')}` : label

  const button = (
    <Button
      fullWidth
      variant="contained"
      startIcon={startIcon}
      onClick={handleClick}
      {...buttonProps}
    >
      {displayLabel}
    </Button>
  )

  if (!isDemo) return button

  return (
    <Tooltip title={DEMO_CREATE_HINT} arrow placement="right">
      <span style={{ display: 'block', width: '100%' }}>{button}</span>
    </Tooltip>
  )
}
