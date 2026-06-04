import { describe, it, expect, vi, beforeEach } from 'vitest'
import { receivablesService } from './receivables'
import { apiClient } from './api'

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

vi.mock('./clients', () => ({
  unwrapApiPayload: (x: unknown) => x,
}))

describe('receivablesService', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
  })

  it('appelle GET /receivables sans filtre', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      summary: { totalOutstanding: 0, clientCount: 0, invoiceCount: 0, aging: {} },
      clients: [],
      invoices: [],
    })

    await receivablesService.getReceivables()

    expect(apiClient.get).toHaveBeenCalledWith('/receivables')
  })

  it('appelle GET /receivables avec période', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      summary: { totalOutstanding: 120, clientCount: 1, invoiceCount: 1, aging: {} },
      clients: [],
      invoices: [],
    })

    const data = await receivablesService.getReceivables({
      start: '2026-01-01',
      end: '2026-12-31',
    })

    expect(apiClient.get).toHaveBeenCalledWith('/receivables?start=2026-01-01&end=2026-12-31')
    expect(data.summary.totalOutstanding).toBe(120)
  })
})
