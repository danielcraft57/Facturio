import { useCallback, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress } from '@mui/material'
import { useAuthStore } from '../stores/authStore'
import { onboardingService } from '../services/onboardingService'

type Props = {
  children: React.ReactNode
}

const SETUP_EXEMPT_PATHS = ['/installation', '/inscription/confirmation']

/**
 * Redirige vers l'assistant (/installation) puis la confirmation email si nécessaire.
 */
export function OnboardingRoute({ children }: Props) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [statusError, setStatusError] = useState(false)

  const exempt = SETUP_EXEMPT_PATHS.includes(location.pathname)

  const loadStatus = useCallback(() => {
    setLoading(true)
    setStatusError(false)
    let cancelled = false
    onboardingService
      .getStatus()
      .then((s) => {
        if (!cancelled) setOnboardingCompleted(s.completed)
      })
      .catch(() => {
        if (!cancelled) {
          setOnboardingCompleted(null)
          setStatusError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => loadStatus(), [loadStatus])

  if (exempt) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (statusError) {
    return (
      <Box sx={{ maxWidth: 480, mx: 'auto', mt: 6, px: 2 }}>
        <Alert
          severity="warning"
          action={
            <Button color="inherit" size="small" onClick={loadStatus}>
              Réessayer
            </Button>
          }
        >
          Impossible de vérifier l&apos;état de votre configuration. Réessayez ou reconnectez-vous.
        </Alert>
      </Box>
    )
  }

  if (!onboardingCompleted) {
    return <Navigate to="/installation" replace />
  }

  if (user && user.emailVerified !== true) {
    return (
      <Navigate
        to="/inscription/confirmation"
        replace
        state={{ email: user.email, onboardingDone: true }}
      />
    )
  }

  return <>{children}</>
}
