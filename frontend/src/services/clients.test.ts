import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clientService } from './clients'
import { apiClient } from './api'

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api')
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      get: vi.fn(),
      getCached: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      invalidateCache: vi.fn(),
    },
  }
})

describe('clientService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('appelle l API pour lister les clients avec les bons paramètres', async () => {
    ;(apiClient.getCached as any).mockResolvedValue({
      success: true,
      data: {
        clients: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    })

    const res = await clientService.getClients({
      search: 'acme',
      status: 'active',
      page: 2,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'asc',
    })

    expect(apiClient.getCached).toHaveBeenCalledWith(
      '/clients?search=acme&status=active&page=2&limit=20&sortBy=name&sortOrder=asc',
      2 * 60 * 1000,
    )
    expect(res.success).toBe(true)
  })

  it('invalide le cache après création de client', async () => {
    ;(apiClient.post as any).mockResolvedValue({
      success: true,
      data: { id: 1, name: 'Test', email: 'test@example.com' },
    })

    const res = await clientService.createClient({
      name: 'Test',
      email: 'test@example.com',
    })

    expect(apiClient.post).toHaveBeenCalledWith('/clients', {
      name: 'Test',
      email: 'test@example.com',
    })
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/clients')
    expect(res.success).toBe(true)
  })
})


