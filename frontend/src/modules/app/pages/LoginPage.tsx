import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Link,
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import { useAuthStore } from '../../../stores/authStore'
import { authService } from '../../../services/authService'

/**
 * Page de connexion
 * 
 * Permet aux utilisateurs de se connecter avec :
 * - Email et mot de passe
 * - Google OAuth
 * 
 * Redirige vers la page d'origine après connexion réussie.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    if (!email || !password) {
      setLocalError('Veuillez remplir tous les champs')
      return
    }

    try {
      await login({ email, password })
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (err: any) {
      setLocalError(err.message || 'Erreur lors de la connexion')
    }
  }

  const handleGoogleLogin = () => {
    authService.loginWithGoogle()
  }

  const displayError = localError || error

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
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Connexion
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connectez-vous à votre compte Facturio
            </Typography>
          </Box>

          {displayError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => { setLocalError(null); clearError() }}>
              {displayError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
            />
            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, py: 1.5 }}
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OU
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            sx={{ mb: 3, py: 1.5 }}
          >
            Continuer avec Google
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Pas encore de compte ?{' '}
              <Link component={RouterLink} to="/signup" underline="hover">
                Créer un compte
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

