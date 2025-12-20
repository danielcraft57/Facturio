import { describe, it, expect, vi, beforeEach } from 'vitest'
import { filingsService } from './filings'
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
      invalidateCache: vi.fn(),
    },
  }
})

describe('filingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('construit bien l URL pour getFilings avec filtres', async () => {
    ;(apiClient.getCached as any).mockResolvedValue({ success: true, data: [] })

    await filingsService.getFilings({ period: '2024-Q1', status: 'draft' })

    expect(apiClient.getCached).toHaveBeenCalledWith(
      '/filings?period=2024-Q1&status=draft',
      5 * 60 * 1000,
    )
  })

  it('invalide le cache après création et mise à jour', async () => {
    ;(apiClient.post as any).mockResolvedValue({
      success: true,
      data: { id: 1 },
    })
    ;(apiClient.patch as any).mockResolvedValue({
      success: true,
      data: { id: 1 },
    })

    await filingsService.createFiling({ type: 'VAT_CA3' })
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/filings')

    await filingsService.updateFiling(1, { status: 'paid' })
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/filings')
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/filings/1')
  })

  it('appelle les bons endpoints pour calculate et addPayment', async () => {
    ;(apiClient.post as any).mockResolvedValue({
      success: true,
      data: { id: 1 },
    })

    await filingsService.calculateFiling(10)
    expect(apiClient.post).toHaveBeenCalledWith('/filings/10/calculate')

    await filingsService.addPayment(10, { amount: 100 })
    expect(apiClient.post).toHaveBeenCalledWith('/filings/10/payments', {
      amount: 100,
    })
  })
})


