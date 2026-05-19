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
  InputAdornment,
  IconButton,
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useAuthStore } from '../../../stores/authStore'
import { authService } from '../../../services/authService'
import type { DeviceVerificationResponse } from '../../../services/authService'

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
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)

  const successMessage = (location.state as any)?.message

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(`/auth/session?from=${encodeURIComponent(from)}`, { replace: true })
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
      const result = await login({ email, password })
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      if ((result as DeviceVerificationResponse | undefined)?.needDeviceVerification) {
        navigate('/auth/session?pending=device', { replace: true })
        return
      }
      navigate(`/auth/session?from=${encodeURIComponent(from)}`, { replace: true })
    } catch (err: any) {
      setLocalError(err.message || 'Erreur lors de la connexion')
    }
  }

  const handleGoogleLogin = () => {
    authService.loginWithGoogle()
  }

  const handleResendVerification = async () => {
    if (!email?.trim()) return
    setResendLoading(true)
    setResendSuccess(null)
    setLocalError(null)
    try {
      const result = await authService.resendVerificationEmail(email.trim())
      setResendSuccess(result?.message || 'Un nouvel email de confirmation a été envoyé.')
    } catch (err: any) {
      setLocalError(err.message || 'Impossible d\'envoyer l\'email.')
    } finally {
      setResendLoading(false)
    }
  }

  const displayError = localError || error
  const isEmailNotVerifiedError = displayError && /vérifier.*email|email.*vérifier|confirmation/i.test(displayError)

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

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => navigate('/login', { replace: true, state: {} })}>
              {successMessage}
            </Alert>
          )}
          {resendSuccess && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setResendSuccess(null)}>
              {resendSuccess}
            </Alert>
          )}
          {displayError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => { setLocalError(null); clearError() }}>
              {displayError}
              {isEmailNotVerifiedError && email?.trim() && (
                <Box sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                  >
                    {resendLoading ? 'Envoi...' : 'Renvoyer l\'email de confirmation'}
                  </Button>
                </Box>
              )}
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <Link component={RouterLink} to="/mot-de-passe-oublie" variant="body2" underline="hover">
                Mot de passe oublié ?
              </Link>
            </Box>
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

