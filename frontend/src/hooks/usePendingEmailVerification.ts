import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'
import { onboardingService } from '../services/onboardingService'
import type { PendingEmailVerification } from '../components/auth/PendingEmailVerificationCard'

/**
 * Détecte un compte connecté dont l’email n’est pas encore validé (sans redirection).
 */
export function usePendingEmailVerification(formEmail?: string) {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const [pending, setPending] = useState<PendingEmailVerification | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!authService.hasSessionToken()) {
      setPending(null)
      return
    }
    setLoading(true)
    try {
      await checkAuth()
      const user = useAuthStore.getState().user
      if (!user || user.emailVerified === true) {
        setPending(null)
        return
      }
      const status = await onboardingService.getStatus()
      setPending({
        email: user.email,
        onboardingCompleted: status.completed,
      })
    } catch {
      authService.clearLocalSession()
      useAuthStore.setState({ user: null, isAuthenticated: false })
      setPending(null)
    } finally {
      setLoading(false)
    }
  }, [checkAuth])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const formNormalized = formEmail?.trim().toLowerCase() ?? ''
  const pendingNormalized = pending?.email.trim().toLowerCase() ?? ''
  const showPending =
    pending != null &&
    (!formNormalized || formNormalized === pendingNormalized)

  const dismiss = useCallback(() => setPending(null), [])

  const setPendingFromEmail = useCallback(
    async (email: string) => {
      try {
        const status = await onboardingService.getStatus()
        setPending({ email, onboardingCompleted: status.completed })
      } catch {
        setPending({ email, onboardingCompleted: false })
      }
    },
    [],
  )

  return {
    pending: showPending ? pending : null,
    loading,
    refresh,
    dismiss,
    setPendingFromEmail,
    clearPending: () => setPending(null),
  }
}
