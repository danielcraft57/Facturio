import { describe, it, expect, vi, beforeEach } from 'vitest'
import { subscriptionsService } from './subscriptions'
import { apiClient } from './api'

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api')
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      getCached: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      invalidateCache: vi.fn(),
    },
  }
})

describe('subscriptionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('utilise le cache pour getPlans', async () => {
    ;(apiClient.getCached as any).mockResolvedValue({ success: true, data: [] })

    await subscriptionsService.getPlans()

    expect(apiClient.getCached).toHaveBeenCalledWith(
      '/subscriptions/plans',
      5 * 60 * 1000,
    )
  })

  it('crée un abonnement et invalide le cache', async () => {
    ;(apiClient.post as any).mockResolvedValue({
      success: true,
      data: { id: 1, clientId: 1, planId: 1 },
    })

    const payload = { clientId: 1, planId: 2, quantity: 3 }

    const res = await subscriptionsService.createSubscription(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/subscriptions', payload)
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/subscriptions')
    expect(res.success).toBe(true)
  })

  it('annule un abonnement en fin de période et invalide les caches', async () => {
    ;(apiClient.post as any).mockResolvedValue({
      success: true,
      data: { id: 1 },
    })

    await subscriptionsService.cancelAtPeriodEnd(42)

    expect(apiClient.post).toHaveBeenCalledWith(
      '/subscriptions/42/cancel-at-period-end',
    )
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/subscriptions')
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/subscriptions/42')
  })

  it('utilise le cache pour les métriques MRR/ARR', async () => {
    ;(apiClient.getCached as any).mockResolvedValue({
      success: true,
      data: 0,
    })

    await subscriptionsService.getMRR()
    await subscriptionsService.getARR()

    expect(apiClient.getCached).toHaveBeenCalledWith(
      '/subscriptions/analytics/mrr',
      10 * 60 * 1000,
    )
    expect(apiClient.getCached).toHaveBeenCalledWith(
      '/subscriptions/analytics/arr',
      10 * 60 * 1000,
    )
  })
})


