import { useState } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { authService } from '../../../services/authService'

/**
 * Page de réinitialisation du mot de passe (lien reçu par email).
 */
export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!newPassword || newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas')
      return
    }
    if (!token) {
      setError('Lien invalide')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(token, newPassword)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err?.message || 'Lien expiré ou invalide')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Alert severity="error">Lien invalide. Demandez un nouveau lien depuis la page "Mot de passe oublié".</Alert>
            <Button component={RouterLink} to="/login" sx={{ mt: 2 }}>Retour à la connexion</Button>
          </Paper>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', py: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Link
            component={RouterLink}
            to="/login"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mb: 2, color: 'text.secondary' }}
          >
            <ArrowBackIcon fontSize="small" /> Retour à la connexion
          </Link>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Nouveau mot de passe
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choisissez un nouveau mot de passe (au moins 8 caractères).
          </Typography>
          {success ? (
            <Alert severity="success">
              Mot de passe mis à jour. Redirection vers la connexion...
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Nouveau mot de passe"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        onClick={() => setShowNewPassword((v) => !v)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Confirmer le mot de passe"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                sx={{ mb: 2 }}
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
              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
              </Button>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  )
}
