import { describe, it, expect, vi, beforeEach } from 'vitest'
import { quoteService } from './quoteService'
import { ApiClient } from './apiClient'

vi.mock('./apiClient', () => ({
  ApiClient: {
    getInstance: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
  },
}))

describe('quoteService', () => {
  let mockApiClient: any

  beforeEach(() => {
    mockApiClient = ApiClient.getInstance()
    vi.clearAllMocks()
  })

  it('appelle l\'API pour getQuotes', async () => {
    const mockResponse = {
      success: true,
      data: { data: [], total: 0, page: 1, limit: 10 },
    }
    ;(mockApiClient.get as any).mockResolvedValue(mockResponse)

    const filters = { status: 'SENT', search: 'DEV-2025' } as any
    await quoteService.getQuotes(filters, 2, 5)

    expect(mockApiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/quotes')
    )
  })

  it('appelle l\'API pour les actions CRUD', async () => {
    const mockResponse = { success: true, data: { id: 1 } }
    ;(mockApiClient.post as any).mockResolvedValue(mockResponse)
    ;(mockApiClient.patch as any).mockResolvedValue(mockResponse)
    ;(mockApiClient.delete as any).mockResolvedValue({ success: true, data: true })

    await quoteService.createQuote({ clientId: 1 } as any)
    expect(mockApiClient.post).toHaveBeenCalledWith('/quotes', expect.any(Object))

    await quoteService.updateQuote(1, {} as any)
    expect(mockApiClient.patch).toHaveBeenCalledWith('/quotes/1', expect.any(Object))

    await quoteService.deleteQuote(1)
    expect(mockApiClient.delete).toHaveBeenCalledWith('/quotes/1')

    await quoteService.sendQuote(1)
    expect(mockApiClient.post).toHaveBeenCalledWith('/quotes/1/send', undefined)
  })
})


