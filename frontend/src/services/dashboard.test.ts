import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardService } from './dashboard'
import { apiClient } from './api'

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api')
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      getCached: vi.fn(),
      get: vi.fn(),
    },
  }
})

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('utilise le cache pour getStats', async () => {
    ;(apiClient.getCached as any).mockResolvedValue({ success: true, data: {} })

    await dashboardService.getStats()

    expect(apiClient.getCached).toHaveBeenCalledWith(
      '/dashboard/stats',
      5 * 60 * 1000,
    )
  })

  it('appelle directement l API pour getStatsRealtime', async () => {
    ;(apiClient.get as any).mockResolvedValue({ success: true, data: {} })

    await dashboardService.getStatsRealtime()

    expect(apiClient.get).toHaveBeenCalledWith('/dashboard/stats')
  })

  it('construit bien l URL pour getStatsByPeriod', async () => {
    ;(apiClient.get as any).mockResolvedValue({ success: true, data: {} })

    await dashboardService.getStatsByPeriod('2025-01-01', '2025-01-31')

    expect(apiClient.get).toHaveBeenCalledWith(
      '/dashboard/stats?startDate=2025-01-01&endDate=2025-01-31',
    )
  })
})


