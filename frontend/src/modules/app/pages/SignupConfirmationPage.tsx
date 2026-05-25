import { useEffect, useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Stack,
  alpha,
  Alert,
} from '@mui/material'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import CodeIcon from '@mui/icons-material/Code'
import { authService } from '../../../services/authService'
import { useAuthStore } from '../../../stores/authStore'

export function SignupConfirmationPage() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const checkAuth = useAuthStore((s) => s.checkAuth)

  useEffect(() => {
    void checkAuth()
  }, [checkAuth])
  const state = location.state as {
    email?: string
    onboardingDone?: boolean
    productCount?: number
  } | null
  const email = state?.email || user?.email
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const handleResend = async () => {
    if (!email) return
    setResendStatus('loading')
    setResendMessage(null)
    try {
      const res = await authService.resendVerificationEmail(email)
      setResendStatus('sent')
      setResendMessage(res.message)
    } catch (e: unknown) {
      setResendStatus('error')
      setResendMessage(e instanceof Error ? e.message : 'Envoi impossible')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '80vh',
        py: 6,
        background: (t) =>
          `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.06)} 0%, transparent 50%)`,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <MarkEmailReadOutlinedIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {state?.onboardingDone ? 'Catalogue installé — confirmez votre email' : 'Confirmez votre email'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {email ? (
                <>
                  Un lien de confirmation a été envoyé à <strong>{email}</strong>.
                </>
              ) : (
                <>Un lien de confirmation vous a été envoyé.</>
              )}
            </Typography>
          </Box>

          {state?.onboardingDone && (
            <Alert severity="success" icon={<CodeIcon />} sx={{ mb: 2 }}>
              {state.productCount != null
                ? `${state.productCount} prestation(s) sont prêtes sur votre compte. `
                : 'Votre espace développeur est prêt. '}
              Validez votre email pour accéder au tableau de bord et facturer.
            </Alert>
          )}

          <Box
            sx={(theme) => ({
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.warning.main, 0.08),
              border: '1px solid',
              borderColor: alpha(theme.palette.warning.main, 0.35),
            })}
          >
            <Typography variant="body2" color="text.secondary">
              Sans confirmation sous <strong>24 h</strong>, votre compte non vérifié sera{' '}
              <strong>supprimé automatiquement</strong> (organisation et catalogue inclus).
            </Typography>
          </Box>

          {resendMessage && (
            <Alert severity={resendStatus === 'error' ? 'error' : 'info'} sx={{ mb: 2 }}>
              {resendMessage}
            </Alert>
          )}

          <Stack spacing={2}>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              disabled={!email || resendStatus === 'loading'}
              onClick={() => void handleResend()}
            >
              {resendStatus === 'loading' ? 'Envoi…' : 'Renvoyer l’email de confirmation'}
            </Button>
            {user?.emailVerified && (
              <Button component={RouterLink} to="/dashboard" variant="contained" size="large" fullWidth>
                Accéder au tableau de bord
              </Button>
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 2 }}>
            Vérifiez les spams. Après clic sur le lien, rechargez cette page ou reconnectez-vous.
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}
