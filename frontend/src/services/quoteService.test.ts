import { describe, it, expect, vi, beforeEach } from 'vitest'
import { quoteService } from './quoteService'
import { mockQuoteService } from './mockQuoteService'

vi.mock('./mockQuoteService', () => ({
  mockQuoteService: {
    getQuotes: vi.fn(),
    getQuote: vi.fn(),
    createQuote: vi.fn(),
    updateQuote: vi.fn(),
    deleteQuote: vi.fn(),
    sendQuote: vi.fn(),
    acceptQuote: vi.fn(),
    rejectQuote: vi.fn(),
    convertToInvoice: vi.fn(),
  },
}))

describe('quoteService (mode mock en dev)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('délègue à mockQuoteService.getQuotes en dev', async () => {
    ;(mockQuoteService.getQuotes as any).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, limit: 10 },
    })

    const filters = { status: 'SENT', search: 'DEV-2025' } as any
    await quoteService.getQuotes(filters, 2, 5)

    expect(mockQuoteService.getQuotes).toHaveBeenCalledWith(filters, 2, 5)
  })

  it('délègue aux méthodes mock pour les actions de cycle de vie', async () => {
    ;(mockQuoteService.createQuote as any).mockResolvedValue({
      success: true,
      data: { id: 1 },
    })
    ;(mockQuoteService.sendQuote as any).mockResolvedValue({
      success: true,
      data: { id: 1 },
    })
    ;(mockQuoteService.acceptQuote as any).mockResolvedValue({
      success: true,
      data: { id: 1, status: 'ACCEPTED' },
    })
    ;(mockQuoteService.convertToInvoice as any).mockResolvedValue({
      success: true,
      data: { invoiceId: 99 },
    })

    await quoteService.createQuote({ clientId: 1 } as any)
    expect(mockQuoteService.createQuote).toHaveBeenCalled()

    await quoteService.sendQuote(1)
    expect(mockQuoteService.sendQuote).toHaveBeenCalledWith(1)

    await quoteService.acceptQuote(1)
    expect(mockQuoteService.acceptQuote).toHaveBeenCalledWith(1)

    await quoteService.convertToInvoice(1)
    expect(mockQuoteService.convertToInvoice).toHaveBeenCalledWith(1)
  })
})


