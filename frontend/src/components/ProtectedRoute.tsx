import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { CircularProgress, Box } from '@mui/material'
import { useAuthStore } from '../stores/authStore'

/**
 * Props du composant ProtectedRoute
 */
interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Composant pour protéger les routes nécessitant une authentification
 * 
 * Redirige vers /login si l'utilisateur n'est pas authentifié.
 * Affiche un loader pendant la vérification de l'authentification.
 * 
 * @example
 * ```tsx
 * <Route path="/dashboard" element={
 *   <ProtectedRoute>
 *     <DashboardPage />
 *   </ProtectedRoute>
 * } />
 * ```
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  // Vérifier l'authentification au montage du composant
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // Rediriger vers login si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Rendre les enfants si authentifié
  return <>{children}</>
}

