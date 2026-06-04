import { describe, it, expect, vi, beforeEach } from 'vitest'
import { payablesService } from './payables'
import { apiClient } from './api'

vi.mock('./api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    invalidateCache: vi.fn(),
  },
}))

vi.mock('./clients', () => ({
  unwrapApiPayload: (x: unknown) => x,
}))

describe('payablesService', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset()
    vi.mocked(apiClient.post).mockReset()
  })

  it('GET /payables', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      summary: { totalOutstanding: 114.52, creditorCount: 1, debtCount: 1 },
      creditors: [],
      debts: [],
    })
    const data = await payablesService.getSummary()
    expect(apiClient.get).toHaveBeenCalledWith('/payables')
    expect(data.summary.totalOutstanding).toBe(114.52)
  })

  it('POST paiement partiel et invalide le cache', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ id: 1, balance: 114.52, status: 'PARTIAL' })
    await payablesService.recordPayment(1, { amount: 50 })
    expect(apiClient.post).toHaveBeenCalledWith('/payables/debts/1/payments', { amount: 50 })
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/payables')
  })

  it('POST send-payment-notice avec montant et invalide le cache', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      emailSent: true,
      sentTo: 'creancier@test.fr',
      publicToken: 'abc',
    })
    const res = await payablesService.sendPaymentNotice(2, {
      paymentAmount: 50,
      email: 'creancier@test.fr',
      copyToSelf: true,
    })
    expect(apiClient.post).toHaveBeenCalledWith('/payables/debts/2/send-payment-notice', {
      paymentAmount: 50,
      email: 'creancier@test.fr',
      copyToSelf: true,
    })
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/payables')
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/payables/debts/2')
    expect(res.emailSent).toBe(true)
    expect(res.sentTo).toBe('creancier@test.fr')
  })
})
