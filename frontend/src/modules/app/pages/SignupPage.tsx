import { useState, useEffect } from 'react'
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom'
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
  Checkbox,
  FormControlLabel,
  FormGroup,
  alpha,
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useAuthStore } from '../../../stores/authStore'
import { authService } from '../../../services/authService'
import { PendingEmailVerificationCard } from '../../../components/auth/PendingEmailVerificationCard'
import { DisabledActionTooltip, formatDisabledReasons } from '../../../components/auth/DisabledActionTooltip'
import {
  getGoogleSignupDisabledReasons,
  getSignupSubmitDisabledReasons,
} from './signupDisabledReasons'
import { usePendingEmailVerification } from '../../../hooks/usePendingEmailVerification'
import { GA_EVENTS } from '../../../config/analyticsEvents'
import { trackGoogleAnalyticsEvent } from '../../../utils/googleAnalytics'

/**
 * Page d'inscription
 * 
 * Permet aux nouveaux utilisateurs de créer un compte avec :
 * - Email, mot de passe, nom, prénom et nom d'organisation
 * - Google OAuth
 * 
 * Redirige vers le dashboard après inscription réussie.
 */
export function SignupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signup, isLoading, error, clearError } = useAuthStore()
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    organizationName: '',
    betaInviteCode: '',
  })

  const {
    pending,
    refresh: refreshPending,
    dismiss: dismissPending,
    setPendingFromEmail,
    clearPending,
  } = usePendingEmailVerification(formData.email)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)
  useEffect(() => {
    const rawCode = searchParams.get('beta') ?? searchParams.get('code')
    if (!rawCode?.trim()) return
    const code = rawCode.trim().toUpperCase()
    setFormData((prev) => (prev.betaInviteCode === code ? prev : { ...prev, betaInviteCode: code }))
  }, [searchParams])

  useEffect(() => {
    const oauthError = searchParams.get('oauth_error')
    if (!oauthError?.trim()) return
    setLocalError(oauthError.trim())
  }, [searchParams])

  useEffect(() => {
    if (!authService.hasSessionToken()) return
    let cancelled = false
    void (async () => {
      await refreshPending()
      const user = useAuthStore.getState().user
      if (!cancelled && user?.emailVerified === true) {
        navigate('/auth/session?from=/dashboard', { replace: true })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, refreshPending])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (
      name === 'email' &&
      pending &&
      value.trim().toLowerCase() !== pending.email.trim().toLowerCase()
    ) {
      clearPending()
    }
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearError()

    // Validation
    if (!formData.email || !formData.password || !formData.organizationName) {
      setLocalError('Veuillez remplir tous les champs obligatoires')
      return
    }

    if (!acceptTerms || !acceptPrivacy) {
      setLocalError('Vous devez accepter les CGU et la politique de confidentialité')
      return
    }

    if (formData.password.length < 8) {
      setLocalError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Les mots de passe ne correspondent pas')
      return
    }

    try {
      trackGoogleAnalyticsEvent(GA_EVENTS.SIGNUP_STARTED, {
        has_beta_code: formData.betaInviteCode.trim().length > 0,
      })
      await signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        organizationName: formData.organizationName,
        acceptTerms: true,
        acceptPrivacy: true,
        betaInviteCode: formData.betaInviteCode.trim() || undefined,
      })
      trackGoogleAnalyticsEvent(GA_EVENTS.SIGNUP_COMPLETED, {
        has_beta_code: Boolean(formData.betaInviteCode.trim()),
      })
      await setPendingFromEmail(formData.email)
      navigate('/auth/session?from=/installation', { replace: true })
    } catch (err: any) {
      setLocalError(err.message || 'Erreur lors de l\'inscription')
    }
  }

  const handleGoogleLogin = async () => {
    setLocalError(null)
    clearError()
    if (!acceptTerms || !acceptPrivacy) {
      setLocalError('Vous devez accepter les CGU et la politique de confidentialité')
      return
    }
    trackGoogleAnalyticsEvent(GA_EVENTS.SIGNUP_STARTED, {
      has_beta_code: formData.betaInviteCode.trim().length > 0,
      method: 'google',
    })
    await authService.loginWithGoogle({
      intent: 'signup',
      betaInviteCode: formData.betaInviteCode.trim() || undefined,
      acceptTerms: true,
      acceptPrivacy: true,
    })
  }

  const canUseGoogleSignup = acceptTerms && acceptPrivacy

  const displayError = localError || error

  const canSubmit =
    acceptTerms &&
    acceptPrivacy &&
    !pending &&
    formData.email.trim().length > 0 &&
    formData.organizationName.trim().length > 0 &&
    formData.password.length >= 8 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword

  const submitDisabled = isLoading || !canSubmit
  const submitDisabledReasons = getSignupSubmitDisabledReasons({
    pending: Boolean(pending),
    email: formData.email,
    organizationName: formData.organizationName,
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    acceptTerms,
    acceptPrivacy,
    isLoading,
  })
  const googleDisabledReasons = getGoogleSignupDisabledReasons({ acceptTerms, acceptPrivacy })

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
              Créer un compte
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Essai gratuit — assistant développeur (stack + catalogue) dès l&apos;inscription
            </Typography>
          </Box>

          {pending && (
            <PendingEmailVerificationCard
              pending={pending}
              onDismiss={dismissPending}
              onResendSuccess={(msg) => setResendSuccess(msg)}
            />
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
              name="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                margin="normal"
                autoComplete="given-name"
              />
              <TextField
                fullWidth
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                margin="normal"
                autoComplete="family-name"
              />
            </Box>
            <TextField
              fullWidth
              label="Nom de l'organisation"
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Code beta testeur (optionnel)"
              name="betaInviteCode"
              value={formData.betaInviteCode}
              onChange={handleChange}
              margin="normal"
              autoComplete="off"
              helperText={
                formData.betaInviteCode.trim()
                  ? 'Code détecté — 3 mois gratuits avec accès plan Agence après validation du compte.'
                  : 'Code campagne court (ex. DEV26) : même code pour tous, jusqu’à épuisement des places.'
              }
            />
            <TextField
              fullWidth
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="new-password"
              helperText="Au moins 8 caractères"
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
            <TextField
              fullWidth
              label="Confirmer le mot de passe"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              required
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Box
              sx={(theme) => ({
                mt: 2.5,
                mb: 0.5,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: !acceptTerms || !acceptPrivacy
                  ? alpha(theme.palette.primary.main, 0.35)
                  : theme.palette.divider,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                transition: 'border-color 0.2s ease',
              })}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}
              >
                Consentements requis
              </Typography>
              <FormGroup sx={{ gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      color="primary"
                      sx={{
                        alignSelf: 'flex-start',
                        mt: 0.15,
                        p: 0.5,
                        '& .MuiSvgIcon-root': { fontSize: 22 },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" component="span" sx={{ lineHeight: 1.5 }}>
                      J&apos;accepte les{' '}
                      <Link
                        component={RouterLink}
                        to="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{ fontWeight: 600 }}
                      >
                        conditions générales d&apos;utilisation
                      </Link>
                      <Box component="span" sx={{ color: 'error.main', ml: 0.25 }} aria-hidden>
                        *
                      </Box>
                    </Typography>
                  }
                  sx={{
                    m: 0,
                    alignItems: 'flex-start',
                    gap: 1,
                    py: 0.75,
                    px: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptPrivacy}
                      onChange={(e) => setAcceptPrivacy(e.target.checked)}
                      color="primary"
                      sx={{
                        alignSelf: 'flex-start',
                        mt: 0.15,
                        p: 0.5,
                        '& .MuiSvgIcon-root': { fontSize: 22 },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" component="span" sx={{ lineHeight: 1.5 }}>
                      J&apos;accepte la{' '}
                      <Link
                        component={RouterLink}
                        to="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        sx={{ fontWeight: 600 }}
                      >
                        politique de confidentialité
                      </Link>
                      <Box component="span" sx={{ color: 'error.main', ml: 0.25 }} aria-hidden>
                        *
                      </Box>
                    </Typography>
                  }
                  sx={{
                    m: 0,
                    alignItems: 'flex-start',
                    gap: 1,
                    py: 0.75,
                    px: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                />
              </FormGroup>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, pl: 0.5 }}>
                Les{' '}
                <Link component={RouterLink} to="/cgv" target="_blank" rel="noopener noreferrer" underline="hover">
                  CGV
                </Link>{' '}
                s&apos;appliquent aux abonnements payants PrestaFacture.
              </Typography>
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
                sx={{ mt: 2, py: 1.5 }}
                disabled={submitDisabled}
              >
                {isLoading
                  ? 'Création du compte...'
                  : pending
                    ? 'Compte en attente — voir le message ci-dessus'
                    : 'Créer mon compte'}
              </Button>
            </DisabledActionTooltip>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OU
            </Typography>
          </Divider>

          <DisabledActionTooltip
            disabled={!canUseGoogleSignup}
            title={formatDisabledReasons(googleDisabledReasons)}
          >
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={!canUseGoogleSignup}
              sx={{ mb: 1, py: 1.5 }}
            >
              Continuer avec Google
            </Button>
          </DisabledActionTooltip>
          {formData.betaInviteCode.trim() ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mb: 2 }}>
              Le code beta {formData.betaInviteCode.trim().toUpperCase()} sera appliqué après connexion Google.
            </Typography>
          ) : (
            <Box sx={{ mb: 2 }} />
          )}

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Déjà un compte ?{' '}
              <Link component={RouterLink} to="/login" underline="hover">
                Se connecter
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

