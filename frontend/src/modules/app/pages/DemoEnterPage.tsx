import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  alpha,
  useTheme,
  Card,
  CardActionArea,
  CardContent,
  Stack,
} from '@mui/material'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { demoService } from '../../../services/demoService'
import {
  DEMO_INTENT_OPTIONS,
  resolveDemoLandingForIntent,
  setDemoIntent,
  type DemoIntent,
} from '../../../utils/demoIntent'
import { useAuthStore } from '../../../stores/authStore'
import { usePageTitle } from '../../../hooks/usePageTitle'

const PREVIEW_ITEMS = [
  'Factures et devis préremplis',
  'Clients et catalogue de prestations',
  'Score conformité facturation électronique',
] as const

/**
 * Page publique d'entrée dans l'espace démo.
 * Aperçu optionnel puis connexion automatique ou sur action utilisateur.
 */
export function DemoEnterPage() {
  const theme = useTheme()
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

  if (phase === 'preview') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 8 }}>
          <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, width: '100%' }}>
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
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
              }}
            >
              <PlayCircleOutlineIcon sx={{ fontSize: 36 }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: 'center' }}>
              Démo pour freelances dev
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 2, lineHeight: 1.7, textAlign: 'center' }}
            >
              Données réalistes déjà remplies — choisissez votre parcours (2 minutes max).
            </Typography>

            <Stack spacing={1} sx={{ mb: 2.5 }}>
              {DEMO_INTENT_OPTIONS.map((option) => {
                const selected = intent === option.id
                return (
                  <Card
                    key={option.id}
                    variant="outlined"
                    sx={{
                      borderColor: selected ? 'primary.main' : 'divider',
                      bgcolor: selected ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
                    }}
                  >
                    <CardActionArea onClick={() => setIntent(option.id)}>
                      <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {option.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
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
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleOutlineIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>

            <Button variant="contained" size="large" fullWidth onClick={() => void startDemo(intent)} sx={{ mb: 1.5 }}>
              Entrer dans la démo
            </Button>
            <Button variant="text" fullWidth onClick={() => navigate('/signup')}>
              Créer mon compte gratuit
            </Button>
          </Paper>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          py: 8,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 5 },
            width: '100%',
            textAlign: 'center',
          }}
        >
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
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            {phase === 'loading' ? (
              <CircularProgress size={32} color="inherit" />
            ) : (
              <PlayCircleOutlineIcon sx={{ fontSize: 36 }} />
            )}
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {phase === 'loading' ? 'Préparation de la démo…' : 'Démo indisponible'}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
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
              <Button variant="contained" size="large" onClick={() => void startDemo(intent)}>
                Réessayer
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/signup')}>
                Créer un compte gratuit
              </Button>
              <Button variant="text" onClick={() => navigate('/login')}>
                Se connecter
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  )
}
