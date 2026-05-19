import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, CircularProgress, Typography, Alert, alpha } from '@mui/material'
import { authService } from '../../../services/authService'
import { useAuthStore } from '../../../stores/authStore'

/**
 * Confirmation d’un nouvel appareil (lien reçu par email).
 */
export function ConfirmDevicePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')?.trim()
    if (!token) {
      setError('Lien invalide.')
      return
    }

    const run = async () => {
      try {
        const result = await authService.verifyDevice(token)
        setUser(result.user)
        navigate('/auth/session?from=/dashboard', { replace: true })
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Impossible de confirmer cette connexion.')
      }
    }

    void run()
  }, [navigate, searchParams, setUser])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        gap: 2,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
      }}
    >
      {error ? (
        <Alert severity="error" sx={{ maxWidth: 420 }}>
          {error}
        </Alert>
      ) : (
        <>
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            Confirmation de votre appareil…
          </Typography>
        </>
      )}
    </Box>
  )
}
