import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  alpha,
} from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { Link as RouterLink } from 'react-router-dom'
import { DEMO_HERO_COLORS, DEMO_HERO_GRADIENT } from './demoTheme'
import { markDemoQuestRecapSeen } from '../../utils/demoExploreStorage'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * Récap affiché quand les 3 quêtes démo sont terminées.
 */
export function DemoQuestCompleteDialog({ open, onClose }: Props) {
  const handleClose = () => {
    markDemoQuestRecapSeen()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmojiEventsIcon sx={{ color: DEMO_HERO_COLORS.main }} />
        Parcours démo terminé
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65 }}>
            Vous avez vu factures, devis et score de conformité. Créez votre compte gratuit pour
            émettre vos propres documents et suivre votre activité.
          </Typography>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(DEMO_HERO_COLORS.main, 0.35),
              background: `linear-gradient(135deg, ${alpha(DEMO_HERO_COLORS.main, 0.08)} 0%, ${alpha(DEMO_HERO_COLORS.deep, 0.04)} 100%)`,
            }}
          >
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Prochaine étape
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Inscription gratuite, assistant catalogue, puis votre première facture en quelques
              minutes.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Button
          variant="contained"
          component={RouterLink}
          to="/signup?from=demo"
          onClick={handleClose}
          fullWidth
          sx={{
            fontWeight: 700,
            background: DEMO_HERO_GRADIENT,
            '&:hover': { background: DEMO_HERO_GRADIENT, filter: 'brightness(1.05)' },
          }}
        >
          Créer mon compte gratuit
        </Button>
        <Button variant="text" onClick={handleClose} fullWidth sx={{ color: 'text.secondary' }}>
          Continuer à explorer
        </Button>
      </DialogActions>
    </Dialog>
  )
}
