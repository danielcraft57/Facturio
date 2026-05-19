import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, Box, Typography } from '@mui/material'
import { BillingPlanSection } from '../BillingPlanSection'
import { billingService } from '../../../services/billing'
import { invalidateBillingUsageCache } from '../../../hooks/useBillingUsage'

const PLAN_LABELS: Record<string, string> = {
  PRO: 'Facturio Pro',
  PRO_EFACTURE: 'Facturio Pro + e-facture',
}

export function SettingsBillingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const billing = searchParams.get('billing')
  const planParam = searchParams.get('plan')

  const [dismissed, setDismissed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const alert = useMemo(() => {
    if (dismissed || !billing) return null
    if (billing === 'success') {
      const planName = planParam ? PLAN_LABELS[planParam] ?? planParam : 'payant'
      return {
        severity: 'success' as const,
        message: `Paiement confirmé — votre abonnement ${planName} est en cours d’activation (synchronisation avec Stripe).`,
      }
    }
    if (billing === 'cancelled') {
      return {
        severity: 'info' as const,
        message: 'Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.',
      }
    }
    return null
  }, [billing, planParam, dismissed])

  useEffect(() => {
    if (billing !== 'success') return
    let cancelled = false
    void (async () => {
      try {
        await billingService.syncSubscription()
      } catch {
        // Webhook ou sync manuelle possible
      }
      if (cancelled) return
      invalidateBillingUsageCache()
      setReloadKey((k) => k + 1)
    })()
    return () => {
      cancelled = true
    }
  }, [billing])

  const clearBillingQuery = () => {
    setDismissed(true)
    const next = new URLSearchParams(searchParams)
    next.delete('billing')
    next.delete('plan')
    setSearchParams(next, { replace: true })
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        Abonnement
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Plan Facturio, quotas et paiement sécurisé par Stripe.
      </Typography>

      {alert && (
        <Alert severity={alert.severity} sx={{ mb: 2 }} onClose={clearBillingQuery}>
          {alert.message}
        </Alert>
      )}

      <BillingPlanSection reloadKey={reloadKey} />
    </Box>
  )
}
