import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useToast } from '../useToast'

type LocationState = {
  message?: string
}

/**
 * Affiche le message de succès après vérification email (state depuis VerifyEmailPage).
 */
export function VerifyEmailSuccessNotifier() {
  const location = useLocation()
  const toast = useToast()
  const shownRef = useRef(false)

  useEffect(() => {
    const state = location.state as LocationState | null
    const message = state?.message?.trim()
    if (!message || shownRef.current) return
    shownRef.current = true
    toast.success(message, {
      title: 'Email confirmé',
      duration: 10000,
    })
    window.history.replaceState({}, document.title, location.pathname + location.search)
  }, [location.pathname, location.search, location.state, toast])

  return null
}
