import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Box, LinearProgress, Typography, alpha, useTheme } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import { useAuthStore } from '../../../stores/authStore'
import { resolvePostAuthPath } from '../../../utils/postAuthRedirect'
import { warmAppDataAfterLogin } from '../../../utils/warmAppData'
import { usePageTitle } from '../../../hooks/usePageTitle'

const MIN_DISPLAY_MS = 1200

const STEPS_DEFAULT = [
  'Vérification de votre session…',
  'Chargement de votre espace…',
  'Préparation du tableau de bord…',
] as const

/**
 * Libellés de chargement selon la destination post-connexion.
 *
 * @param from - Chemin cible (query `from`)
 */
function stepsForDestination(from: string): readonly string[] {
  if (from.startsWith('/installation')) {
    return [
      'Vérification de votre session…',
      'Préparation de l\'assistant catalogue…',
      'Presque prêt…',
    ]
  }
  if (from.includes('/factures')) {
    return ['Vérification de votre session…', 'Chargement des factures…', 'Ouverture…']
  }
  if (from.includes('/devis')) {
    return ['Vérification de votre session…', 'Chargement des devis…', 'Ouverture…']
  }
  if (from.includes('/parametres')) {
    return ['Vérification de votre session…', 'Chargement des paramètres…', 'Ouverture…']
  }
  return STEPS_DEFAULT
}

/**
 * Page d’attente entre connexion et application (validation session + appareil).
 */
export function AuthBootPage() {
  const theme = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { bootstrapSession } = useAuthStore()

  const pendingDevice = searchParams.get('pending') === 'device'
  const from = searchParams.get('from') || '/installation'

  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(8)
  const [error, setError] = useState<string | null>(null)

  const stepLabel = useMemo(() => {
    const steps = stepsForDestination(from)
    return steps[Math.min(stepIndex, steps.length - 1)]
  }, [from, stepIndex])

  usePageTitle(pendingDevice ? 'Confirmer la connexion' : error ? 'Connexion interrompue' : stepLabel)

  useEffect(() => {
    if (pendingDevice) return

    const steps = stepsForDestination(from)
    let cancelled = false
    const started = performance.now()

    const stepTimer = window.setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1))
      setProgress((p) => Math.min(p + 18, 92))
    }, 420)

    const run = async () => {
      try {
        const result = await bootstrapSession()
        if (cancelled) return
        if (result?.needDeviceVerification) {
          navigate(`/auth/session?pending=device`, { replace: true })
          return
        }
        const elapsed = performance.now() - started
        const wait = Math.max(0, MIN_DISPLAY_MS - elapsed)
        window.setTimeout(() => {
          if (cancelled) return
          void (async () => {
            const user = useAuthStore.getState().user
            await warmAppDataAfterLogin()
            const target =
              user?.emailVerified === true ? from : await resolvePostAuthPath(user)

            // Sécurité : on évite un redirection relative vers " [object Object] "
            // (peut arriver si `from` a été encodé depuis un objet).
            const safeTarget =
              typeof target === 'string' && target.startsWith('/')
                ? target
                : '/dashboard'

            navigate(safeTarget, { replace: true })
          })()
        }, wait)
      } catch (err: unknown) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'Session invalide'
        setError(message)
        window.setTimeout(() => navigate('/login', { replace: true }), 2400)
      }
    }

    void run()

    return () => {
      cancelled = true
      window.clearInterval(stepTimer)
    }
  }, [bootstrapSession, from, navigate, pendingDevice])

  if (pendingDevice) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
        }}
      >
        <Box sx={{ maxWidth: 420, textAlign: 'center' }}>
          <MailOutlineIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Confirmez cette connexion
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            Nous avons détecté une connexion depuis un nouvel appareil ou pendant une session active
            ailleurs. Un email vient de vous être envoyé — cliquez sur le lien pour accéder à
            PrestaFacture.
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        gap: 3,
        bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
          color: 'primary.main',
        }}
      >
        <LockOutlinedIcon />
      </Box>

      <Box sx={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {error ? 'Connexion interrompue' : 'Ouverture de votre espace'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
          {error ?? stepLabel}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={error ? 100 : progress}
          sx={{
            height: 4,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            '& .MuiLinearProgress-bar': {
              borderRadius: 2,
              transition: 'transform 0.35s ease',
            },
          }}
        />
      </Box>
    </Box>
  )
}
