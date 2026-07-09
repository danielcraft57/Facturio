import { Alert, Box, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { demoService } from '../../services/demoService'

/**
 * Bandeau persistant en mode démo : rappelle que l'espace est en lecture seule.
 */
export function DemoModeBanner() {
  if (!demoService.isDemoSession()) return null

  return (
    <Box sx={{ pb: 1.5 }}>
      <Alert
        severity="info"
        action={
          <Button component={RouterLink} to="/signup" color="inherit" size="small">
            Créer mon compte
          </Button>
        }
      >
        Mode démo — consultation uniquement. Vous ne pouvez pas créer de documents ni envoyer d&apos;emails.
      </Alert>
    </Box>
  )
}
