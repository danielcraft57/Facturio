import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material'
import CheckCircleOutline from '@mui/icons-material/CheckCircleOutline'
import { authService } from '../../../services/authService'
import { useAuthStore } from '../../../stores/authStore'

/**
 * Page de vérification d'adresse email (lien reçu après inscription).
 * Appelle l'API avec le token, affiche succès puis redirige vers la connexion.
 */
export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState<string>('')
  const hasVerifiedRef = useRef(false)

  useEffect(() => {
    // En dev avec React.StrictMode, les effets peuvent être appelés 2 fois.
    // On s'assure de ne déclencher la vérification qu'une seule fois.
    if (hasVerifiedRef.current) return
    if (!token?.trim()) {
      setStatus('error')
      setMessage('Lien invalide.')
      return
    }
    hasVerifiedRef.current = true
    authService
      .verifyEmail(token.trim())
      .then(async (res) => {
        setStatus('success')
        setMessage(res?.message || 'Adresse email confirmée.')
        try {
          await checkAuth()
        } catch {
          /* session absente : connexion manuelle */
        }
      })
      .catch((err: any) => {
        setStatus('error')
        setMessage(err?.message || 'Lien invalide ou expiré. Demandez un nouvel email de confirmation.')
      })
  }, [token])

  const goToDashboard = () => {
    navigate('/dashboard', {
      replace: true,
      state: { message: 'Email confirmé. Bienvenue sur PrestaFacture !' },
    })
  }

  const goToLogin = () => {
    navigate('/login', {
      replace: true,
      state: {
        message:
          status === 'success'
            ? 'Email confirmé. Connectez-vous pour accéder à votre tableau de bord.'
            : undefined,
        from: '/dashboard',
      },
    })
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
            p: { xs: 3, sm: 4 },
            width: '100%',
            textAlign: 'center',
          }}
        >
          {status === 'loading' && (
            <>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Vérification de votre adresse email en cours...
              </Typography>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircleOutline sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                Email confirmé
              </Typography>
              <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                {message}
              </Alert>
              <Button variant="contained" size="large" onClick={goToDashboard} sx={{ mb: 1 }}>
                Accéder au tableau de bord
              </Button>
              <Button variant="text" size="small" onClick={goToLogin}>
                Ou se connecter sur un autre appareil
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {message}
              </Alert>
              <Button component={RouterLink} to="/signup" variant="contained" size="large" sx={{ mb: 1 }}>
                Créer un nouveau compte
              </Button>
              <Button component={RouterLink} to="/login" variant="text" size="small">
                Retour à la connexion
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  )
}
