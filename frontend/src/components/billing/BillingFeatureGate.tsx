import { useEffect, useState, type ReactNode } from 'react'
import { Alert, Box, Button, CircularProgress } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { billingService, type BillingUsage } from '../../services/billing'
import { unwrapApiPayload } from '../../services/clients'

export type BillingGatedFeature = 'publicApi' | 'accounting' | 'financeModule' | 'prospection'

type BillingFeatureGateProps = {
  children: ReactNode
  feature: BillingGatedFeature
  featureLabel?: string
}

/**
 * Affiche le contenu uniquement si le plan inclut la fonctionnalité demandée.
 */
export function BillingFeatureGate({
  children,
  feature,
  featureLabel = 'cette fonctionnalité',
}: BillingFeatureGateProps) {
  const [usage, setUsage] = useState<BillingUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await billingService.getUsage()
        if (!cancelled) setUsage(unwrapApiPayload<BillingUsage>(res))
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

  if (!usage?.limits[feature]) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        {featureLabel} est réservée au plan <strong>Pro</strong> (ou supérieur).
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
