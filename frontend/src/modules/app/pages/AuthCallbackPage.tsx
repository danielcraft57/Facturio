import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useAuthStore } from '../../../stores/authStore'

/**
 * Page de callback pour l'authentification Google OAuth
 * 
 * Appelée après la redirection depuis Google.
 * Récupère le token depuis le cookie et met à jour l'état d'authentification.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    // Vérifier l'authentification après le callback Google
    const handleCallback = async () => {
      try {
        await checkAuth()
        // Rediriger vers le dashboard après authentification réussie
        navigate('/dashboard', { replace: true })
      } catch (error) {
        // En cas d'erreur, rediriger vers login
        navigate('/login', { replace: true })
      }
    }

    handleCallback()
  }, [checkAuth, navigate])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress />
      <Typography variant="body1" color="text.secondary">
        Connexion en cours...
      </Typography>
    </Box>
  )
}

