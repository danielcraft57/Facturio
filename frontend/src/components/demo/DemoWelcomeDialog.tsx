import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import DescriptionIcon from '@mui/icons-material/Description'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { demoService } from '../../services/demoService'
import { hasSeenDemoWelcome, markDemoWelcomeSeen, demoExploreProgress } from '../../utils/demoExploreStorage'
import { DEMO_HERO_COLORS, DEMO_HERO_GRADIENT } from './demoTheme'

const QUESTS = [
  {
    step: 1,
    icon: <ReceiptLongIcon fontSize="small" />,
    title: 'Ouvrir une facture exemple',
    hint: 'PDF, lignes, statut payé ou en retard',
    path: '/factures/inbox',
    cta: 'Voir les factures',
  },
  {
    step: 2,
    icon: <DescriptionIcon fontSize="small" />,
    title: 'Consulter un devis',
    hint: 'Du brouillon à l\'accepté',
    path: '/devis/inbox',
    cta: 'Voir les devis',
  },
  {
    step: 3,
    icon: <VerifiedUserIcon fontSize="small" />,
    title: 'Score conformité facture électronique',
    hint: 'Paramètres → Facturation électronique',
    path: '/parametres/facturation-electronique',
    cta: 'Voir le score',
  },
] as const

/**
 * Popin d'accueil démo : oriente vers le aha moment (facture, devis, conformité).
 */
export function DemoWelcomeDialog() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!demoService.isDemoSession()) return
    if (hasSeenDemoWelcome()) return
    const t = window.setTimeout(() => setOpen(true), 500)
    return () => window.clearTimeout(t)
  }, [])

  const close = () => {
    markDemoWelcomeSeen()
    setOpen(false)
  }

  const go = (path: string) => {
    close()
    navigate(path)
  }

  if (!demoService.isDemoSession()) return null

  const { done, total } = demoExploreProgress()
  const progressPct = total > 0 ? (done / total) * 100 : 0

  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          overflow: 'hidden',
          border: `1px solid ${alpha(DEMO_HERO_COLORS.main, 0.35)}`,
          boxShadow: `0 24px 64px ${alpha(DEMO_HERO_COLORS.deep, 0.35)}`,
        },
      }}
    >
      <Box
        sx={{
          background: DEMO_HERO_GRADIENT,
          color: DEMO_HERO_COLORS.text,
          px: 3,
          py: 2.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <SportsEsportsIcon sx={{ fontSize: 28, opacity: 0.95 }} />
          <Chip
            label="Mode démo"
            size="small"
            sx={{
              bgcolor: alpha('#fff', 0.16),
              color: '#fff',
              fontWeight: 700,
              letterSpacing: '0.06em',
            }}
          />
        </Stack>
        <DialogTitle sx={{ p: 0, fontWeight: 800, color: 'inherit', fontSize: '1.35rem' }}>
          Bienvenue dans l&apos;espace démo
        </DialogTitle>
        <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.92, lineHeight: 1.65 }}>
          Données préremplies pour freelances dev. Explorez sans configurer — la création et
          l&apos;envoi d&apos;emails s&apos;activent avec votre compte gratuit.
        </Typography>
      </Box>

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={1.5}>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Parcours express — 3 min
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {done}/{total}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(DEMO_HERO_COLORS.main, 0.12),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: DEMO_HERO_GRADIENT,
                },
              }}
            />
          </Box>

          <Stack spacing={1}>
            {QUESTS.map((quest) => (
              <Box
                key={quest.step}
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'flex-start',
                  p: 1.25,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alpha(DEMO_HERO_COLORS.main, 0.2),
                  bgcolor: alpha(DEMO_HERO_COLORS.main, theme.palette.mode === 'dark' ? 0.08 : 0.04),
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    color: '#fff',
                    background: DEMO_HERO_GRADIENT,
                    boxShadow: `0 0 12px ${alpha(DEMO_HERO_COLORS.main, 0.4)}`,
                  }}
                >
                  {quest.step}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.25 }}>
                    <Box sx={{ color: DEMO_HERO_COLORS.main, display: 'flex' }}>{quest.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {quest.title}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {quest.hint}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, pb: 2.5, pt: 0 }}>
        <Button
          onClick={() => go('/factures/inbox')}
          variant="contained"
          sx={{
            fontWeight: 700,
            background: DEMO_HERO_GRADIENT,
            boxShadow: `0 8px 24px ${alpha(DEMO_HERO_COLORS.main, 0.35)}`,
            '&:hover': { background: DEMO_HERO_GRADIENT, filter: 'brightness(1.06)' },
          }}
        >
          Première victoire : voir une facture
        </Button>
        <Button onClick={close} color="inherit">
          Explorer seul
        </Button>
        <Button component={RouterLink} to="/signup" onClick={close} sx={{ ml: 'auto' }}>
          Créer mon compte
        </Button>
      </DialogActions>
    </Dialog>
  )
}
