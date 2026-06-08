import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
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

  const exempt = SETUP_EXEMPT_PATHS.includes(location.pathname)

  useEffect(() => {
    let cancelled = false
    onboardingService
      .getStatus()
      .then((s) => {
        if (!cancelled) setOnboardingCompleted(s.completed)
      })
      .catch(() => {
        if (!cancelled) setOnboardingCompleted(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

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
