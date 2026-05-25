import { useEffect, useState, type ReactNode } from 'react'
import { Alert, Box, Button, CircularProgress } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { billingService, type BillingUsage } from '../../services/billing'

type ProPlanGateProps = {
  children: ReactNode
  featureLabel?: string
}

/**
 * Affiche le contenu uniquement si l’organisation a un plan Pro (API publique incluse).
 */
export function ProPlanGate({ children, featureLabel = 'cette fonctionnalité' }: ProPlanGateProps) {
  const [usage, setUsage] = useState<BillingUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await billingService.getUsage()
        if (!cancelled) setUsage(res.data?.data ?? (res as { data?: BillingUsage }).data ?? null)
      } catch {
        if (!cancelled) setError('Impossible de charger votre abonnement.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!usage?.limits.publicApi) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {featureLabel} est réservée au plan <strong>Pro</strong> (ou supérieur). Passez à un abonnement payant
        pour créer des jetons API et consulter la documentation.
        <Box sx={{ mt: 2 }}>
          <Button component={RouterLink} to="/parametres/abonnement" variant="contained" size="small">
            Voir les offres Pro
          </Button>
        </Box>
      </Alert>
    )
  }

  return <>{children}</>
}
