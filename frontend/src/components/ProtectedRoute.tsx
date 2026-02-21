import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

/**
 * Props du composant ProtectedRoute
 */
interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Protège les routes (tableau de bord, factures, etc.).
 * Redirige vers /login si l'utilisateur n'est pas authentifié.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

