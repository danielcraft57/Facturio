import { useState, useEffect } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
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
} from '@mui/material'
import GoogleIcon from '@mui/icons-material/Google'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useAuthStore } from '../../../stores/authStore'
import { authService } from '../../../services/authService'

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
  const { signup, isLoading, error, clearError, isAuthenticated } = useAuthStore()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    organizationName: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptPrivacy, setAcceptPrivacy] = useState(false)

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/auth/session?from=/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
      const result = await signup({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        organizationName: formData.organizationName,
        acceptTerms: true,
        acceptPrivacy: true,
      })
      if (result && (result as any).needVerification) {
        navigate('/login', { replace: true, state: { message: (result as any).message } })
        return
      }
      navigate('/auth/session?from=/dashboard', { replace: true })
    } catch (err: any) {
      setLocalError(err.message || 'Erreur lors de l\'inscription')
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
              Créer un compte
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Commencez votre essai gratuit dès maintenant
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
            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  required
                />
              }
              label={
                <Typography variant="body2">
                  J&apos;accepte les{' '}
                  <Link component={RouterLink} to="/terms" target="_blank" underline="hover">
                    CGU
                  </Link>
                </Typography>
              }
              sx={{ mt: 1, alignItems: 'flex-start' }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptPrivacy}
                  onChange={(e) => setAcceptPrivacy(e.target.checked)}
                  required
                />
              }
              label={
                <Typography variant="body2">
                  J&apos;accepte la{' '}
                  <Link component={RouterLink} to="/privacy" target="_blank" underline="hover">
                    politique de confidentialité
                  </Link>
                </Typography>
              }
              sx={{ alignItems: 'flex-start' }}
            />
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Les{' '}
              <Link component={RouterLink} to="/cgv" target="_blank" underline="hover">
                CGV
              </Link>{' '}
              s&apos;appliquent aux abonnements payants Facturio.
            </Typography>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 2, py: 1.5 }}
              disabled={isLoading || !acceptTerms || !acceptPrivacy}
            >
              {isLoading ? 'Création du compte...' : 'Créer mon compte'}
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

