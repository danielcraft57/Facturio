import { useEffect, useState } from 'react'
import { billingService, type BillingUsage } from '../services/billing'
import { unwrapApiPayload } from '../services/clients'

const CACHE_MS = 90_000
let memoryCache: { data: BillingUsage | null; at: number } | null = null
let inflight: Promise<BillingUsage | null> | null = null

async function fetchUsage(): Promise<BillingUsage | null> {
  if (memoryCache && Date.now() - memoryCache.at < CACHE_MS) {
    return memoryCache.data
  }
  if (inflight) return inflight

  inflight = billingService
    .getUsage()
    .then((res) => {
      const data = unwrapApiPayload<BillingUsage>(res)
      memoryCache = { data, at: Date.now() }
      return data
    })
    .catch(() => {
      memoryCache = { data: null, at: Date.now() }
      return null
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function invalidateBillingUsageCache() {
  memoryCache = null
}

export function useBillingUsage() {
  const [usage, setUsage] = useState<BillingUsage | null>(memoryCache?.data ?? null)
  const [loading, setLoading] = useState(!memoryCache || Date.now() - memoryCache.at >= CACHE_MS)

  useEffect(() => {
    let cancelled = false
    void fetchUsage().then((data) => {
      if (!cancelled) {
        setUsage(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { usage, loading }
}
