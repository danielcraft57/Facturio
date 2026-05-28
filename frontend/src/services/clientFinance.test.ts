import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clientFinanceService } from './clientFinance'
import { apiClient } from './api'

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api')
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      get: vi.fn(),
      post: vi.fn(),
      invalidateCache: vi.fn(),
    },
  }
})

describe('clientFinanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('appelle GET /clients/:id/finance avec les filtres de période', async () => {
    const payload = {
      balances: {
        totalInvoicedTtc: 0,
        totalPaidNet: 0,
        totalRefunded: 0,
        totalCreditsAvailable: 0,
        totalCreditsApplied: 0,
        outstandingBalance: 0,
      },
      taxes: { vatCollected: 0, vatCredited: 0, netVat: 0, revenueHt: 0 },
      movements: [],
      avoirs: [],
      invoiceCount: 0,
      quoteCount: 0,
      openInvoices: [],
    }
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: payload,
    })

    const res = await clientFinanceService.getFinance('abc1234567', {
      start: '2026-01-01',
      end: '2026-12-31',
    })

    expect(apiClient.get).toHaveBeenCalledWith(
      '/clients/abc1234567/finance?start=2026-01-01&end=2026-12-31',
    )
    expect(res.balances.outstandingBalance).toBe(0)
  })

  it('invalide le cache finance après création de crédit', async () => {
    ;(apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { id: 42, total: 100 },
    })

    await clientFinanceService.createCredit('abc1234567', {
      label: 'Geste',
      amountTtc: 100,
    })

    expect(apiClient.post).toHaveBeenCalledWith('/clients/abc1234567/credits', {
      label: 'Geste',
      amountTtc: 100,
    })
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/clients/abc1234567/finance')
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/avoirs')
  })

  it('invalide le cache finance après opération diverse', async () => {
    ;(apiClient.post as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { id: 7 },
    })

    await clientFinanceService.createMiscOperation('abc1234567', {
      label: 'Ajustement',
      amountTtc: 12,
      kind: 'adjustment',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/clients/abc1234567/misc-operations', {
      label: 'Ajustement',
      amountTtc: 12,
      kind: 'adjustment',
    })
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/clients/abc1234567/finance')
  })
})
