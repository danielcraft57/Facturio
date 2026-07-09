import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import { demoService } from '../../../services/demoService'
import { useAuthStore } from '../../../stores/authStore'
import { usePageTitle } from '../../../hooks/usePageTitle'

/**
 * Page publique d'entrée dans l'espace démo.
 * Connecte automatiquement le visiteur et redirige vers le tableau de bord.
 */
export function DemoEnterPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  usePageTitle(loading ? 'Ouverture de la démo' : error ? 'Démo indisponible' : 'Espace démo')

  const startDemo = async () => {
    setLoading(true)
    setError(null)

    try {
      const info = await demoService.getInfo()
      setInfoMessage(info.message)

      const result = await demoService.enter()
      setUser(result.user)
      useAuthStore.setState({ isAuthenticated: true, error: null })

      const { warmAppDataAfterLogin } = await import('../../../utils/warmAppData')
      await warmAppDataAfterLogin()

      navigate('/dashboard', {
        replace: true,
        state: { demoMessage: result.message },
      })
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Impossible d\'ouvrir la démo pour le moment.'
      setError(message)
      setLoading(false)
    }
  }

  useEffect(() => {
    void startDemo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            {loading ? (
              <CircularProgress size={32} color="inherit" />
            ) : (
              <PlayCircleOutlineIcon sx={{ fontSize: 36 }} />
            )}
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {loading ? 'Préparation de la démo…' : 'Démo indisponible'}
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
            {loading
              ? infoMessage ??
                'Chargement d\'un espace prérempli avec clients, devis et factures. Quelques secondes…'
              : 'La démo n\'a pas pu démarrer. Réessayez ou créez un compte gratuit.'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              {error}
            </Alert>
          )}

          {error && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button variant="contained" size="large" onClick={() => void startDemo()}>
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
