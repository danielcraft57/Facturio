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
import { PendingEmailVerificationCard } from '../../../components/auth/PendingEmailVerificationCard'
import { DisabledActionTooltip, formatDisabledReasons } from '../../../components/auth/DisabledActionTooltip'
import { getLoginSubmitDisabledReasons } from './signupDisabledReasons'
import { usePendingEmailVerification } from '../../../hooks/usePendingEmailVerification'

/**
 * Page de connexion
 */
export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)

  const {
    pending,
    refresh: refreshPending,
    dismiss: dismissPending,
    setPendingFromEmail,
    clearPending,
  } = usePendingEmailVerification(email)

  const resolveFrom = () => {
    const rawFrom = (location.state as any)?.from
    if (typeof rawFrom === 'string' && rawFrom.trim()) return rawFrom
    if (rawFrom && typeof rawFrom === 'object' && typeof rawFrom.pathname === 'string' && rawFrom.pathname.trim()) {
      return rawFrom.pathname
    }
    return '/dashboard'
  }

  const successMessage = (location.state as { message?: string } | null)?.message

  // Redirection uniquement si l’email est déjà confirmé
  useEffect(() => {
    if (!authService.hasSessionToken()) return
    let cancelled = false
    void (async () => {
      try {
        await refreshPending()
        const user = useAuthStore.getState().user
        if (cancelled || user?.emailVerified !== true) return
        const from = resolveFrom()
        navigate(`/auth/session?from=${encodeURIComponent(from)}`, { replace: true })
      } catch {
        authService.clearLocalSession()
        useAuthStore.setState({ user: null, isAuthenticated: false })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, location, refreshPending])

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (pending && value.trim().toLowerCase() !== pending.email.trim().toLowerCase()) {
      clearPending()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()
    setResendSuccess(null)

    if (!email || !password) {
      setLocalError('Veuillez remplir tous les champs')
      return
    }

    try {
      const result = await login({ email, password })
      if ((result as DeviceVerificationResponse | undefined)?.needDeviceVerification) {
        navigate('/auth/session?pending=device', { replace: true })
        return
      }
      const user = useAuthStore.getState().user
      if (user?.emailVerified === true) {
        const from = resolveFrom()
        navigate(`/auth/session?from=${encodeURIComponent(from)}`, { replace: true })
        return
      }
      await setPendingFromEmail(user?.email ?? email)
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : 'Erreur lors de la connexion')
    }
  }

  const handleGoogleLogin = async () => {
    await authService.loginWithGoogle({ intent: 'login' })
  }

  const displayError = localError || error

  const canSubmit = email.trim().length > 0 && password.length > 0
  const submitDisabled = isLoading || !canSubmit
  const submitDisabledReasons = getLoginSubmitDisabledReasons({ email, password, isLoading })

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
              Connectez-vous à votre espace
            </Typography>
          </Box>

          {pending && (
            <PendingEmailVerificationCard
              pending={pending}
              onDismiss={dismissPending}
              onResendSuccess={(msg) => setResendSuccess(msg)}
            />
          )}

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
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
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
            <DisabledActionTooltip
              disabled={submitDisabled}
              title={formatDisabledReasons(submitDisabledReasons)}
            >
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, py: 1.5 }}
                disabled={submitDisabled}
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </DisabledActionTooltip>
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
            sx={{ mb: 2, py: 1.5 }}
          >
            Continuer avec Google
          </Button>

          <Button
            fullWidth
            variant="text"
            size="large"
            component={RouterLink}
            to="/essayer"
            sx={{ mb: 3, py: 1 }}
          >
            Essayer sans compte — facture exemple en 2 min
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
