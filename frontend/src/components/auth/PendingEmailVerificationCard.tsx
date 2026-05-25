import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
  alpha,
} from '@mui/material'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import { authService } from '../../services/authService'

export type PendingEmailVerification = {
  email: string
  onboardingCompleted: boolean
}

type Props = {
  pending: PendingEmailVerification
  /** Masque l’encart (ex. email du formulaire différent du compte en attente). */
  onDismiss?: () => void
  onResendSuccess?: (message: string) => void
}

export function PendingEmailVerificationCard({ pending, onDismiss, onResendSuccess }: Props) {
  const [resendLoading, setResendLoading] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const handleResend = async () => {
    setResendLoading(true)
    setResendError(null)
    try {
      const res = await authService.resendVerificationEmail(pending.email)
      onResendSuccess?.(res.message || 'Email de confirmation renvoyé.')
    } catch (e: unknown) {
      setResendError(e instanceof Error ? e.message : 'Envoi impossible')
    } finally {
      setResendLoading(false)
    }
  }

  const continuePath = pending.onboardingCompleted
    ? '/inscription/confirmation'
    : '/installation'

  const continueLabel = pending.onboardingCompleted
    ? 'Voir la page de confirmation email'
    : 'Continuer l’assistant développeur'

  return (
    <Alert
      severity="info"
      icon={<MarkEmailReadOutlinedIcon />}
      sx={(theme) => ({
        mb: 3,
        textAlign: 'left',
        border: '1px solid',
        borderColor: alpha(theme.palette.info.main, 0.4),
        '& .MuiAlert-message': { width: '100%' },
      })}
      action={
        onDismiss ? (
          <Button color="inherit" size="small" onClick={onDismiss}>
            Masquer
          </Button>
        ) : undefined
      }
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        Compte en attente de validation
      </Typography>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        L’adresse <strong>{pending.email}</strong> n’est pas encore confirmée. Consultez votre boîte mail
        (et les spams), ou renvoyez le lien de confirmation.
      </Typography>
      {!pending.onboardingCompleted && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Vous pouvez d’abord terminer l’assistant (stack + catalogue) avant de valider votre email.
        </Typography>
      )}
      {resendError && (
        <Typography variant="caption" color="error" display="block" sx={{ mb: 1 }}>
          {resendError}
        </Typography>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="outlined"
          size="small"
          color="info"
          disabled={resendLoading}
          onClick={() => void handleResend()}
        >
          {resendLoading ? 'Envoi…' : 'Renvoyer l’email'}
        </Button>
        <Button component={RouterLink} to={continuePath} variant="contained" size="small" color="info">
          {continueLabel}
        </Button>
        <Button variant="text" size="small" onClick={() => void authService.logout()}>
          Autre compte
        </Button>
      </Stack>
    </Alert>
  )
}
