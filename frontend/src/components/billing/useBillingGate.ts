import { useEffect, useState } from 'react'
import { billingService, type BillingUsage } from '../../services/billing'
import { unwrapApiPayload } from '../../services/clients'

type BillingGateState = {
  usage: BillingUsage | null
  loading: boolean
  error: string | null
}

/**
 * Charge l'usage billing pour les garde-fous plan (cache partagé via billingService).
 */
export function useBillingGate(): BillingGateState {
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

  return { usage, loading, error }
}
