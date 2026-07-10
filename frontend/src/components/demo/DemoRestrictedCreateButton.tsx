import type { ReactNode } from 'react'
import { Button, Tooltip, type ButtonProps } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DEMO_CREATE_HINT, useDemoMode } from '../../hooks/useDemoMode'
import { blockDemoCreateIfNeeded } from '../../utils/demoCreateGuard'

type DemoRestrictedCreateButtonProps = Omit<ButtonProps, 'onClick'> & {
  label: string
  onCreate: () => void
  /** Appelé après navigation mobile (fermeture drawer). */
  onAfterClick?: () => void
  startIcon?: ReactNode
}

/**
 * Bouton « Nouveau … » : en mode démo, aperçu du libellé mais action bloquée avec explication.
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
    if (isDemo) {
      blockDemoCreateIfNeeded()
      onAfterClick?.()
      return
    }
    onCreate()
    onAfterClick?.()
  }

  const button = (
    <Button
      fullWidth
      variant="contained"
      startIcon={startIcon}
      onClick={handleClick}
      {...buttonProps}
      sx={{
        ...(isDemo
          ? {
              opacity: 0.92,
              borderStyle: 'dashed',
              borderWidth: 1,
              borderColor: 'primary.light',
            }
          : {}),
        ...buttonProps.sx,
      }}
    >
      {label}
    </Button>
  )

  if (!isDemo) return button

  return (
    <Tooltip title={DEMO_CREATE_HINT} arrow placement="right">
      <span style={{ display: 'block', width: '100%' }}>{button}</span>
    </Tooltip>
  )
}
