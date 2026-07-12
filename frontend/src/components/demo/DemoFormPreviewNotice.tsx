import { Alert, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useDemoMode } from '../../hooks/useDemoMode'

/**
 * Bandeau « aperçu interactif » dans les formulaires ouverts en mode démo.
 */
export function DemoFormPreviewNotice() {
  const isDemo = useDemoMode()
  if (!isDemo) return null

  return (
    <Alert
      severity="info"
      sx={{ mb: 2 }}
      action={
        <Button color="inherit" size="small" component={RouterLink} to="/signup?from=demo">
          S&apos;inscrire
        </Button>
      }
    >
      Aperçu interactif : remplissez le formulaire librement. L&apos;enregistrement nécessite un compte
      gratuit.
    </Alert>
  )
}
