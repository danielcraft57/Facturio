import { Alert, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

type Props = {
  resource: 'factures' | 'devis'
  draftCount: number
  /** Masquer si on est déjà dans le dossier brouillons. */
  hidden?: boolean
}

const LABELS = {
  factures: { singular: 'brouillon', plural: 'brouillons', path: '/factures/brouillons' },
  devis: { singular: 'brouillon', plural: 'brouillons', path: '/devis/brouillons' },
} as const

/**
 * Bandeau « Reprendre votre brouillon » quand des brouillons existent.
 */
export function DraftResumeBanner({ resource, draftCount, hidden }: Props) {
  if (hidden || draftCount <= 0) return null

  const meta = LABELS[resource]
  const countLabel = draftCount > 1 ? `${draftCount} ${meta.plural}` : `1 ${meta.singular}`

  return (
    <Alert
      severity="info"
      sx={{ mb: 2 }}
      action={
        <Button color="inherit" size="small" component={RouterLink} to={meta.path}>
          Reprendre
        </Button>
      }
    >
      Vous avez {countLabel} en attente — reprenez là où vous en étiez.
    </Alert>
  )
}
