import { describe, it, expect, vi, beforeEach } from 'vitest'
import { accountingService } from './accounting'
import { apiClient } from './api'

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api')
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      getCached: vi.fn(),
      post: vi.fn(),
      client: {
        get: vi.fn(),
      },
    },
  }
})

describe('accountingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('utilise le cache pour getAccounts et getJournals', async () => {
    ;(apiClient.getCached as any).mockResolvedValue({ success: true, data: [] })

    await accountingService.getAccounts()
    await accountingService.getJournals()

    expect(apiClient.getCached).toHaveBeenCalledWith(
      '/accounting/accounts',
      10 * 60 * 1000,
    )
    expect(apiClient.getCached).toHaveBeenCalledWith(
      '/accounting/journals',
      10 * 60 * 1000,
    )
  })

  it('construit bien les URLs pour getTrialBalance et getGeneralLedger', async () => {
    ;(apiClient.getCached as any).mockResolvedValue({ success: true, data: [] })

    await accountingService.getTrialBalance('2025-01-01', '2025-12-31')
    expect(apiClient.getCached).toHaveBeenCalledWith(
      '/accounting/reports/balance?start=2025-01-01&end=2025-12-31',
      5 * 60 * 1000,
    )

    await accountingService.getGeneralLedger(
      '2025-01-01',
      '2025-12-31',
      '706',
    )
    expect(apiClient.getCached).toHaveBeenCalledWith(
      '/accounting/reports/general-ledger?start=2025-01-01&end=2025-12-31&account=706',
      5 * 60 * 1000,
    )
  })

  it('appelle le bon endpoint pour exportFEC', async () => {
    const blob = new Blob(['fec'], { type: 'text/plain' })
    ;(apiClient.client.get as any).mockResolvedValue({ data: blob })

    const res = await accountingService.exportFEC('2025-01-01', '2025-12-31')

    expect(apiClient.client.get).toHaveBeenCalledWith(
      '/accounting/exports/fec?start=2025-01-01&end=2025-12-31',
      { responseType: 'blob' },
    )
    expect(res).toBe(blob)
  })
})


