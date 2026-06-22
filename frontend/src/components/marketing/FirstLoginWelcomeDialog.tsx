import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
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
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined'
import { Link as RouterLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useBillingUsage } from '../../hooks/useBillingUsage'
import { BETA_PROGRAM } from '../../modules/marketing/constants/siteContent'
import { isWelcomeCampaignActive } from '../../config/welcomeCampaign'
import { hasSeenWelcomeCampaign, markWelcomeCampaignSeen } from '../../utils/welcomeCampaignStorage'
import { billingService, type BetaProgramStats } from '../../services/billing'
import { unwrapApiPayload } from '../../services/clients'

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

/**
 * Popin marketing de bienvenue à la première connexion (campagne beta, jusqu'à fin sept. 2026).
 * Style aligné sur le bandeau beta du site (couleurs primary / secondary PrestaFacture).
 */
export function FirstLoginWelcomeDialog() {
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const { usage } = useBillingUsage()
  const [open, setOpen] = useState(false)
  const [stats, setStats] = useState<BetaProgramStats | null>(null)

  const firstName = useMemo(() => {
    const name = user?.firstName?.trim()
    return name || 'freelance'
  }, [user?.firstName])

  useEffect(() => {
    if (!user?.id) return
    if (usage?.betaTester?.active === true) return
    if (!isWelcomeCampaignActive()) return
    if (hasSeenWelcomeCampaign(user.id)) return

    const timer = window.setTimeout(() => setOpen(true), 700)
    return () => window.clearTimeout(timer)
  }, [user?.id, usage?.betaTester?.active])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      try {
        const res = await billingService.getBetaProgramStats()
        if (!cancelled) setStats(unwrapApiPayload<BetaProgramStats>(res))
      } catch {
        if (!cancelled) setStats(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const closeDialog = () => {
    if (user?.id) markWelcomeCampaignSeen(user.id)
    setOpen(false)
  }

  if (!user?.id || !isWelcomeCampaignActive() || usage?.betaTester?.active === true) {
    return null
  }

  const remaining = stats?.remainingSlots
  const maxSlots = stats?.maxSlots ?? 0
  const progress =
    maxSlots > 0 && remaining != null ? Math.min(100, ((maxSlots - remaining) / maxSlots) * 100) : null
  const showSlots = stats?.programOpen && remaining != null && remaining > 0

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
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          },
        },
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          border: 1,
          borderColor: alpha(theme.palette.secondary.main, 0.35),
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
          bgcolor: 'background.paper',
          animation: `${fadeInUp} 0.45s ease-out`,
        },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -48,
          right: -48,
          width: 160,
          height: 160,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.secondary.main, 0.08),
          pointerEvents: 'none',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: -64,
          left: -32,
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          pointerEvents: 'none',
        }}
      />

      <IconButton
        aria-label="Fermer"
        onClick={closeDialog}
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 2,
          color: 'text.secondary',
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 3, sm: 4 } }}>
        <Stack spacing={2.5}>
          <Stack spacing={1.5} alignItems="flex-start">
            <Chip
              icon={<RocketLaunchIcon />}
              label={BETA_PROGRAM.badge}
              color="secondary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
              Bienvenue, {firstName} !
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Vous arrivez au bon moment : le programme beta est ouvert pour les freelances dev qui veulent
              tester PrestaFacture en conditions réelles.
            </Typography>
          </Stack>

          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.2),
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1 }}>
              <CelebrationOutlinedIcon color="secondary" sx={{ mt: 0.25 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  {BETA_PROGRAM.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                  {BETA_PROGRAM.description}
                </Typography>
              </Box>
            </Stack>

            <Stack component="ul" spacing={0.75} sx={{ m: 0, mt: 2, p: 0, listStyle: 'none' }}>
              {BETA_PROGRAM.steps.map((step) => (
                <Box
                  component="li"
                  key={step}
                  sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}
                >
                  <CheckIcon color="secondary" sx={{ fontSize: 18, mt: 0.2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {step}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {showSlots && (
            <Box>
              <Typography variant="body2" fontWeight={600} gutterBottom color="secondary.main">
                Il reste {remaining} place{remaining > 1 ? 's' : ''} sur {maxSlots} — c&apos;est une fenêtre
                limitée, profitez-en tant qu&apos;elle est ouverte.
              </Typography>
              {progress != null && (
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  color="secondary"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              )}
            </Box>
          )}

          <Stack spacing={1.25}>
            <Button
              variant="contained"
              color="secondary"
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
              color="primary"
              size="large"
              component={RouterLink}
              to="/parametres/abonnement"
              onClick={closeDialog}
              sx={{ py: 1.15, fontWeight: 600 }}
            >
              J&apos;ai un code beta — l&apos;activer
            </Button>
            <Button variant="text" onClick={closeDialog} sx={{ color: 'text.secondary' }}>
              Plus tard
            </Button>
          </Stack>

          <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center' }}>
            Affichée une seule fois par compte. Campagne visible jusqu&apos;à fin septembre 2026.
          </Typography>
        </Stack>
      </Box>
    </Dialog>
  )
}
