import { useEffect, useRef } from 'react'
import { useAuthStore } from '../stores/authStore'
import { authService } from '../services/authService'

/**
 * Au chargement, resynchronise le profil (emailVerified) si un token est en cache.
 */
export function AuthSessionHydrator() {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current || !authService.hasSessionToken()) return
    ran.current = true
    void checkAuth()
  }, [checkAuth])

  return null
}
