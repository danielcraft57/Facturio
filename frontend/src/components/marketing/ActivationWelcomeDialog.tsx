import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  alpha,
  keyframes,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import CheckIcon from '@mui/icons-material/Check'
import { Link as RouterLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useBillingUsage } from '../../hooks/useBillingUsage'
import { demoService } from '../../services/demoService'
import {
  hasSeenActivationWelcome,
  markActivationWelcomeSeen,
} from '../../utils/accountActivationStorage'
import { isWelcomeCampaignActive } from '../../config/welcomeCampaign'

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

const STEPS = [
  'Complétez les infos de votre entreprise',
  'Créez votre première facture',
  'Ajoutez un client si besoin',
] as const

/**
 * Popin de bienvenue pour un compte neuf sans facture (hors démo et beta).
 */
export function ActivationWelcomeDialog() {
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const { usage, loading } = useBillingUsage()
  const [open, setOpen] = useState(false)

  const firstName = useMemo(() => {
    const name = user?.firstName?.trim()
    return name || 'freelance'
  }, [user?.firstName])

  const isEligible = useMemo(() => {
    if (!user?.id || demoService.isDemoSession()) return false
    if (loading) return false
    if (usage?.betaTester?.active === true) return false
    if (isWelcomeCampaignActive()) return false
    if ((usage?.usage?.invoicesThisMonth ?? 0) > 0) return false
    if (hasSeenActivationWelcome(user.id)) return false
    return true
  }, [user?.id, loading, usage?.betaTester?.active, usage?.usage?.invoicesThisMonth])

  useEffect(() => {
    if (!isEligible) return
    const timer = window.setTimeout(() => setOpen(true), 800)
    return () => window.clearTimeout(timer)
  }, [isEligible])

  const closeDialog = () => {
    if (user?.id) markActivationWelcomeSeen(user.id)
    setOpen(false)
  }

  if (!isEligible) return null

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(6px)',
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          },
        },
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.2),
          animation: `${fadeInUp} 0.45s ease-out`,
        },
      }}
    >
      <IconButton
        aria-label="Fermer"
        onClick={closeDialog}
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
      >
        <CloseIcon />
      </IconButton>

      <Box sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={2.5}>
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={700}>
              Bienvenue, {firstName} !
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Votre espace est prêt. Trois petites étapes pour émettre votre première facture.
            </Typography>
            <LinearProgress variant="determinate" value={0} sx={{ height: 6, borderRadius: 3, mt: 1 }} />
          </Stack>

          <Stack component="ul" spacing={1} sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {STEPS.map((step) => (
              <Box component="li" key={step} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <CheckIcon color="primary" sx={{ fontSize: 18, mt: 0.2, opacity: 0.35 }} />
                <Typography variant="body2" color="text.secondary">
                  {step}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Stack spacing={1.25}>
            <Button
              variant="contained"
              size="large"
              startIcon={<RocketLaunchIcon />}
              component={RouterLink}
              to="/factures/inbox?create=1"
              onClick={closeDialog}
              sx={{ py: 1.25, fontWeight: 700 }}
            >
              Créer ma première facture
            </Button>
            <Button
              variant="outlined"
              size="large"
              component={RouterLink}
              to="/parametres/entreprise"
              onClick={closeDialog}
            >
              Compléter mon entreprise
            </Button>
            <Button variant="text" onClick={closeDialog} sx={{ color: 'text.secondary' }}>
              Explorer d&apos;abord
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Dialog>
  )
}
