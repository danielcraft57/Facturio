import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  IconButton,
  Stack,
  Typography,
  alpha,
  keyframes,
  useTheme,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined'
import CheckIcon from '@mui/icons-material/Check'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import { Link as RouterLink } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useBillingUsage } from '../../hooks/useBillingUsage'
import { hasSeenBetaWelcome, markBetaWelcomeSeen } from '../../utils/betaWelcomeStorage'

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

import { EFACTURE_NOT_LIVE_SHORT } from '../../modules/e-invoicing/eInvoicingCopy'

const BETA_PERKS = [
  'Plan Agence complet : compta FEC, créances, dettes, API',
  'Devis, factures, PDF, Stripe, score conformité et export Factur-X (XML)',
  'Pas de filigrane, pas de quotas Free pendant votre période beta',
  `Vos retours orientent la feuille de route — ${EFACTURE_NOT_LIVE_SHORT}`,
] as const

function formatDateFr(iso: string | null | undefined): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

/**
 * Popin de remerciement pour les beta testeurs (remplace la campagne « premier code beta »).
 */
export function BetaTesterWelcomeDialog() {
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const { usage } = useBillingUsage()
  const [open, setOpen] = useState(false)

  const firstName = useMemo(() => {
    const name = user?.firstName?.trim()
    return name || 'beta testeur'
  }, [user?.firstName])

  const beta = usage?.betaTester
  const isActiveBeta = beta?.active === true

  useEffect(() => {
    if (!user?.id || !isActiveBeta) return
    if (hasSeenBetaWelcome(user.id)) return

    const timer = window.setTimeout(() => setOpen(true), 700)
    return () => window.clearTimeout(timer)
  }, [user?.id, isActiveBeta])

  const closeDialog = () => {
    if (user?.id) markBetaWelcomeSeen(user.id)
    setOpen(false)
  }

  if (!user?.id || !isActiveBeta) {
    return null
  }

  const expiresLabel = formatDateFr(beta?.expiresAt)
  const daysLeft = beta?.daysRemaining

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
            bgcolor: alpha(theme.palette.secondary.main, 0.14),
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
          borderColor: alpha(theme.palette.secondary.main, 0.4),
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.12)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
          bgcolor: 'background.paper',
          animation: `${fadeInUp} 0.45s ease-out`,
        },
      }}
    >
      <IconButton
        aria-label="Fermer"
        onClick={closeDialog}
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, color: 'text.secondary' }}
      >
        <CloseIcon />
      </IconButton>

      <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 3, sm: 4 } }}>
        <Stack spacing={2.5}>
          <Stack spacing={1.5} alignItems="flex-start">
            <Chip
              icon={<CelebrationOutlinedIcon />}
              label="Beta testeur activé"
              color="secondary"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em' }}>
              Merci {firstName}, vous êtes des nôtres !
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Votre code beta a bien été pris en compte. Vous testez Facturio avec un accès complet
              {expiresLabel ? ` jusqu'au ${expiresLabel}` : ''}
              {daysLeft != null && daysLeft > 0 ? ` (${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''})` : ''}.
            </Typography>
          </Stack>

          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: 1,
              borderColor: alpha(theme.palette.secondary.main, 0.25),
              bgcolor: alpha(theme.palette.secondary.main, 0.06),
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Ce que vous pouvez faire dès maintenant
            </Typography>
            <Stack component="ul" spacing={0.75} sx={{ m: 0, p: 0, listStyle: 'none' }}>
              {BETA_PERKS.map((perk) => (
                <Box component="li" key={perk} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckIcon color="secondary" sx={{ fontSize: 18, mt: 0.2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {perk}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ color: 'text.secondary' }}>
            <EmailOutlinedIcon sx={{ fontSize: 20, mt: 0.2 }} color="primary" />
            <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
              Un email de bienvenue beta vient de vous être envoyé avec le détail de votre accès et, si
              configuré, le lien du questionnaire retour. Pensez à vérifier vos spams.
            </Typography>
          </Stack>

          <Stack spacing={1.25}>
            <Button
              variant="contained"
              color="secondary"
              size="large"
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
              to="/parametres/entreprise"
              onClick={closeDialog}
              sx={{ py: 1.15, fontWeight: 600 }}
            >
              Compléter mon profil entreprise
            </Button>
            <Button variant="text" onClick={closeDialog} sx={{ color: 'text.secondary' }}>
              Explorer l&apos;app
            </Button>
          </Stack>

          <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center' }}>
            Affichée une seule fois. Un bug ou une idée ? Répondez à l&apos;email de bienvenue beta.
          </Typography>
        </Stack>
      </Box>
    </Dialog>
  )
}
