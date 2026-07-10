import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import { Link as RouterLink } from 'react-router-dom'
import {
  QUEST_COLORS,
  questMissionPanelSx,
  questMissionReveal,
  questPrimaryButtonSx,
} from '../demo/demoTheme'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * Récap animé quand les 3 étapes d'activation compte sont terminées.
 */
export function ActivationQuestCompleteDialog({ open, onClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          animation: open ? `${questMissionReveal} 0.45s ease-out` : 'none',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmojiEventsIcon sx={{ color: QUEST_COLORS.main }} />
        Mission accomplie
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65 }}>
            Entreprise, facture et client : les bases sont en place. Vous pouvez facturer sereinement
            depuis le tableau de bord.
          </Typography>
          <Box sx={questMissionPanelSx()}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Capacités débloquées
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Création depuis la fiche client, PDF avec mentions légales, mode avancé sur les
              brouillons.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
        <Button
          variant="contained"
          component={RouterLink}
          to="/factures/inbox?create=1"
          onClick={onClose}
          fullWidth
          sx={questPrimaryButtonSx()}
        >
          Nouvelle facture
        </Button>
        <Button variant="text" onClick={onClose} fullWidth sx={{ color: 'text.secondary' }}>
          Retour au tableau de bord
        </Button>
      </DialogActions>
    </Dialog>
  )
}
