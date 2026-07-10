import { Alert, Box, Button, Chip, Stack, Typography, alpha } from '@mui/material'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { Link as RouterLink } from 'react-router-dom'
import { demoService } from '../../services/demoService'
import { DEMO_HERO_COLORS, DEMO_HERO_GRADIENT } from './demoTheme'

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
        sx={{
          alignItems: 'center',
          background: `linear-gradient(90deg, ${alpha('#0d9488', 0.12)} 0%, ${alpha('#134e4a', 0.06)} 100%)`,
          border: `1px solid ${alpha(DEMO_HERO_COLORS.main, 0.28)}`,
          '& .MuiAlert-icon': { color: DEMO_HERO_COLORS.main },
        }}
        action={
          <Button
            component={RouterLink}
            to="/signup"
            size="small"
            variant="contained"
            sx={{
              fontWeight: 700,
              whiteSpace: 'nowrap',
              background: DEMO_HERO_GRADIENT,
              '&:hover': { background: DEMO_HERO_GRADIENT, filter: 'brightness(1.05)' },
            }}
          >
            Passer à mon compte
          </Button>
        }
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <Chip
            label="MODE DÉMO"
            size="small"
            sx={{
              fontWeight: 800,
              letterSpacing: '0.08em',
              bgcolor: alpha(DEMO_HERO_COLORS.main, 0.15),
              color: DEMO_HERO_COLORS.deep,
              height: 22,
            }}
          />
          <Typography variant="body2" component="span" sx={{ lineHeight: 1.55 }}>
            Données exemple prêtes à explorer. Inscrivez-vous gratuitement pour créer vos documents et
            envoyer vos emails.
          </Typography>
        </Stack>
      </Alert>
    </Box>
  )
}
