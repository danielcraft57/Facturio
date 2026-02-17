import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

/**
 * Props du composant ProtectedRoute
 */
interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Indique si l'accès est en "réseau local" (localhost / 127.0.0.1).
 * En local, pas de login requis. En production (domaine public), le login est requis.
 */
function isLocalAccess(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === ''
}

/**
 * Protège les routes (tableau de bord, etc.).
 * - En local (localhost) : accès direct sans login.
 * - En production (domaine public, ex. facturio.danielcraft.fr) : accès si connecté (token), sinon redirection vers /login.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isLocalAccess()) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

