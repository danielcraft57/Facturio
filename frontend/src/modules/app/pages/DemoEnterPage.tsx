import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
  Card,
  CardActionArea,
  CardContent,
  Stack,
} from '@mui/material'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import SportsEsportsIcon from '@mui/icons-material/SportsEsports'
import { demoService } from '../../../services/demoService'
import {
  DEMO_INTENT_OPTIONS,
  resolveDemoLandingForIntent,
  setDemoIntent,
  type DemoIntent,
} from '../../../utils/demoIntent'
import { useAuthStore } from '../../../stores/authStore'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { DemoPublicShell } from '../../../components/demo/DemoPublicShell'
import {
  DEMO_HERO_COLORS,
  demoModeChipSx,
  demoPrimaryButtonSx,
  demoPublicCardSx,
} from '../../../components/demo/demoTheme'

const PREVIEW_ITEMS = [
  'Une facture conforme déjà remplie (PDF en 30 s)',
  'Devis et clients exemples — même flux que en vrai',
  'Score e-facture 2026 sans configurer l\'entreprise',
] as const

/**
 * Page publique d'entrée dans l'espace démo.
 * Preview orientée résultat (CTV) puis connexion sur action utilisateur.
 */
export function DemoEnterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setUser } = useAuthStore()

  const autoStart = searchParams.get('auto') === '1'
  const intentParam = searchParams.get('intent')
  const initialIntent: DemoIntent =
    intentParam === 'start' || intentParam === 'compliance' ? intentParam : 'invoice'
  const [intent, setIntent] = useState<DemoIntent>(initialIntent)
  const [phase, setPhase] = useState<'preview' | 'loading' | 'error'>(autoStart ? 'loading' : 'preview')
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  usePageTitle(
    phase === 'preview'
      ? 'Essayer la démo'
      : phase === 'loading'
        ? 'Ouverture de la démo'
        : 'Démo indisponible',
  )

  const startDemo = async (chosenIntent: DemoIntent = intent) => {
    setPhase('loading')
    setError(null)
    setDemoIntent(chosenIntent)

    try {
      const info = await demoService.getInfo()
      setInfoMessage(info.message)

      if (!info.available) {
        throw new Error(
          'La démo est vide ou en cours de préparation. Lancez `npm run ensure-demo --prefix server` puis réessayez.',
        )
      }

      const result = await demoService.enter()
      setUser(result.user)
      useAuthStore.setState({ isAuthenticated: true, error: null })

      const { warmAppDataAfterLogin } = await import('../../../utils/warmAppData')
      await warmAppDataAfterLogin()

      const landingPath = await resolveDemoLandingForIntent(chosenIntent)

      navigate(landingPath, {
        replace: true,
        state: { demoMessage: result.message, demoIntent: chosenIntent },
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Impossible d\'ouvrir la démo pour le moment.'
      setError(message)
      setPhase('error')
    }
  }

  useEffect(() => {
    if (!autoStart) return
    void startDemo(initialIntent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  const selectedOption = DEMO_INTENT_OPTIONS.find((o) => o.id === intent)

  if (phase === 'preview') {
    return (
      <DemoPublicShell>
        <Box sx={{ ...demoPublicCardSx(), p: { xs: 3, sm: 5 } }}>
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
            <SportsEsportsIcon sx={{ color: DEMO_HERO_COLORS.main }} />
            <Chip label="Démo guidée" size="small" sx={demoModeChipSx()} />
          </Stack>

          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              bgcolor: alpha(DEMO_HERO_COLORS.main, 0.14),
              color: DEMO_HERO_COLORS.main,
              boxShadow: `0 0 24px ${alpha(DEMO_HERO_COLORS.main, 0.35)}`,
            }}
          >
            <PlayCircleOutlineIcon sx={{ fontSize: 36 }} />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, textAlign: 'center', letterSpacing: '0.02em' }}>
            Votre première victoire en 2 minutes
          </Typography>
          <Typography variant="body1" sx={{ mb: 2.5, lineHeight: 1.7, textAlign: 'center', opacity: 0.9 }}>
            Données réalistes déjà là — choisissez ce que vous voulez voir en premier, sans créer de compte.
          </Typography>

          <Stack spacing={1} sx={{ mb: 2.5 }}>
            {DEMO_INTENT_OPTIONS.map((option) => {
              const selected = intent === option.id
              return (
                <Card
                  key={option.id}
                  variant="outlined"
                  sx={{
                    bgcolor: selected ? alpha(DEMO_HERO_COLORS.main, 0.12) : alpha(DEMO_HERO_COLORS.deep, 0.35),
                    borderColor: selected ? DEMO_HERO_COLORS.main : alpha(DEMO_HERO_COLORS.main, 0.22),
                    boxShadow: selected ? `0 0 20px ${alpha(DEMO_HERO_COLORS.main, 0.25)}` : 'none',
                  }}
                >
                  <CardActionArea onClick={() => setIntent(option.id)}>
                    <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: DEMO_HERO_COLORS.text }}>
                        {option.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: alpha(DEMO_HERO_COLORS.text, 0.75) }}>
                        {option.subtitle}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              )
            })}
          </Stack>

          <List dense sx={{ mb: 3 }}>
            {PREVIEW_ITEMS.map((item) => (
              <ListItem key={item} disableGutters>
                <ListItemIcon sx={{ minWidth: 36, color: DEMO_HERO_COLORS.main }}>
                  <CheckCircleOutlineIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item}
                  slotProps={{ primary: { sx: { color: alpha(DEMO_HERO_COLORS.text, 0.92), fontSize: '0.875rem' } } }}
                />
              </ListItem>
            ))}
          </List>

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={() => void startDemo(intent)}
            sx={{ ...demoPrimaryButtonSx(), mb: 1.5, py: 1.35 }}
          >
            {selectedOption?.id === 'invoice'
              ? 'Voir une facture conforme'
              : selectedOption?.id === 'compliance'
                ? 'Voir le score e-facture'
                : 'Parcourir devis → facture'}
          </Button>
          <Button
            variant="text"
            fullWidth
            onClick={() => navigate('/signup')}
            sx={{ color: alpha(DEMO_HERO_COLORS.text, 0.85) }}
          >
            Créer mon compte gratuit
          </Button>
        </Box>
      </DemoPublicShell>
    )
  }

  return (
    <DemoPublicShell>
      <Box sx={{ ...demoPublicCardSx(), p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            bgcolor: alpha(DEMO_HERO_COLORS.main, 0.14),
            color: DEMO_HERO_COLORS.main,
          }}
        >
          {phase === 'loading' ? (
            <CircularProgress size={32} sx={{ color: DEMO_HERO_COLORS.main }} />
          ) : (
            <PlayCircleOutlineIcon sx={{ fontSize: 36 }} />
          )}
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          {phase === 'loading' ? 'Préparation de la grille…' : 'Démo indisponible'}
        </Typography>

        <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7, opacity: 0.9 }}>
          {phase === 'loading'
            ? infoMessage ??
              'Chargement d\'un espace prérempli avec clients, devis et factures. Quelques secondes…'
            : 'La démo n\'a pas pu démarrer. Réessayez ou créez un compte gratuit.'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
            {error}
          </Alert>
        )}

        {phase === 'error' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Button variant="contained" size="large" onClick={() => void startDemo(intent)} sx={demoPrimaryButtonSx()}>
              Réessayer
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{
                borderColor: alpha(DEMO_HERO_COLORS.main, 0.5),
                color: DEMO_HERO_COLORS.text,
              }}
            >
              Créer un compte gratuit
            </Button>
            <Button variant="text" onClick={() => navigate('/login')} sx={{ color: alpha(DEMO_HERO_COLORS.text, 0.8) }}>
              Se connecter
            </Button>
          </Box>
        )}
      </Box>
    </DemoPublicShell>
  )
}
