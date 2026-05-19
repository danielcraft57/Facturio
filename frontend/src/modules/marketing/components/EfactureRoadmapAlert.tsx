import { Alert, type AlertProps } from '@mui/material'
import { EFACTURE_ROADMAP_DISCLAIMER } from '../constants/siteContent'

type Props = {
  severity?: AlertProps['severity']
  sx?: AlertProps['sx']
}

/** Rappel légal : module e-facture / PA en cours de développement. */
export function EfactureRoadmapAlert({ severity = 'warning', sx }: Props) {
  return (
    <Alert severity={severity} sx={{ borderRadius: 2, ...sx }}>
      {EFACTURE_ROADMAP_DISCLAIMER}
    </Alert>
  )
}
