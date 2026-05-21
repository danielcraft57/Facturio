import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiClient } from './apiClient'

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}

vi.mock('./apiClient', () => ({
  ApiClient: {
    getInstance: () => mockClient,
    resetInstanceForTests: vi.fn(),
  },
}))

describe('quoteService', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    ApiClient.resetInstanceForTests()
    vi.resetModules()
  })

  it('appelle l\'API pour getQuotes', async () => {
    mockClient.get.mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, limit: 10 },
    })
    const { quoteService } = await import('./quoteService')

    await quoteService.getQuotes({ status: 'SENT', search: 'DEV-2025' } as never, 2, 5)

    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/quotes'),
    )
  })

  it('appelle l\'API pour les actions CRUD', async () => {
    mockClient.post.mockResolvedValue({ success: true, data: { id: 1 } })
    mockClient.patch.mockResolvedValue({ success: true, data: { id: 1 } })
    mockClient.delete.mockResolvedValue({ success: true, data: true })
    const { quoteService } = await import('./quoteService')

    await quoteService.createQuote({ clientId: 1 } as never)
    expect(mockClient.post).toHaveBeenCalledWith('/quotes', expect.any(Object))

    await quoteService.updateQuote(1, {} as never)
    expect(mockClient.patch).toHaveBeenCalledWith('/quotes/1', expect.any(Object))

    await quoteService.deleteQuote(1)
    expect(mockClient.delete).toHaveBeenCalledWith('/quotes/1')

    await quoteService.sendQuote(1)
    expect(mockClient.post).toHaveBeenCalledWith('/quotes/1/send')
  })
})
