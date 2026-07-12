import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { Link as RouterLink } from 'react-router-dom'
import { demoService } from '../../services/demoService'
import {
  demoBannerButtonSx,
  demoBannerSurfaceSx,
  demoModeChipSx,
} from './demoTheme'

/**
 * Bandeau démo orienté valeur : montre ce qu'on peut explorer, invite à s'inscrire pour agir.
 */
export function DemoModeBanner() {
  if (!demoService.isDemoSession()) return null

  return (
    <Box sx={{ pb: 1.5 }}>
      <Alert
        icon={<SportsEsportsIcon fontSize="inherit" />}
        severity="info"
        sx={demoBannerSurfaceSx()}
        action={
          <Button
            component={RouterLink}
            to="/signup"
            size="small"
            variant="contained"
            sx={demoBannerButtonSx()}
          >
            Passer à mon compte
          </Button>
        }
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <Chip label="MODE DÉMO" size="small" sx={demoModeChipSx()} />
          <Typography variant="body2" component="span" sx={{ lineHeight: 1.55, color: 'inherit' }}>
            Données exemple prêtes à explorer. Inscrivez-vous gratuitement pour créer vos documents et
            envoyer vos emails.
          </Typography>
        </Stack>
      </Alert>
    </Box>
  )
}
