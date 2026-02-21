import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { authService } from '../../../services/authService'

/**
 * Page "Mot de passe oublié" : saisie de l'email pour recevoir un lien de réinitialisation.
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError('Veuillez saisir votre adresse email')
      return
    }
    setLoading(true)
    try {
      await authService.forgotPassword(email.trim())
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
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
            Mot de passe oublié
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Saisissez votre adresse email. Si un compte existe, vous recevrez un lien pour réinitialiser votre mot de passe (valide 1 heure).
          </Typography>
          {sent ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Si ce compte existe, un email vous a été envoyé. Pensez à vérifier les spams.
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
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                sx={{ mb: 2 }}
              />
              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}>
                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>
            </form>
          )}
        </Paper>
      </Box>
    </Container>
  )
}
