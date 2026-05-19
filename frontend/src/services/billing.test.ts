import { describe, it, expect, vi, beforeEach } from 'vitest'
import { billingService } from './billing'

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { apiClient } from './api'

describe('billingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getUsage appelle GET billing/usage', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { success: true, data: { plan: 'FREE', planLabel: 'Free' } },
    } as never)

    await billingService.getUsage()

    expect(apiClient.get).toHaveBeenCalledWith('billing/usage')
  })

  it('createCheckout envoie le plan choisi', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { success: true, data: { url: 'https://checkout.stripe.com/test' } },
    } as never)

    await billingService.createCheckout('PRO_EFACTURE')

    expect(apiClient.post).toHaveBeenCalledWith('billing/checkout', {
      plan: 'PRO_EFACTURE',
      billingSchedule: 'MONTHLY',
    })
  })

  it('createPortal appelle POST billing/portal', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      data: { success: true, data: { url: 'https://billing.stripe.com/portal' } },
    } as never)

    await billingService.createPortal()

    expect(apiClient.post).toHaveBeenCalledWith('billing/portal', {})
  })
})
