import { describe, it, expect, vi, beforeEach } from 'vitest'
import { productService } from './productService'
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

describe('productService', () => {
  let mockApiClient: any

  beforeEach(() => {
    mockApiClient = ApiClient.getInstance()
    vi.clearAllMocks()
  })

  it('appelle l\'API pour getProducts', async () => {
    const mockResponse = {
      success: true,
      data: { data: [], total: 0, page: 1, limit: 10 },
    }
    ;(mockApiClient.get as any).mockResolvedValue(mockResponse)

    const filters = { kind: 'SERVICE', search: 'WordPress' } as any
    await productService.getProducts(filters, 2, 5)

    expect(mockApiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/products')
    )
  })

  it('appelle l\'API pour create/update/delete', async () => {
    const mockResponse = { success: true, data: { id: 999, name: 'Test' } }
    ;(mockApiClient.post as any).mockResolvedValue(mockResponse)
    ;(mockApiClient.patch as any).mockResolvedValue(mockResponse)
    ;(mockApiClient.delete as any).mockResolvedValue({ success: true, data: true })

    await productService.createProduct({ name: 'Test' } as any)
    expect(mockApiClient.post).toHaveBeenCalledWith('/products', expect.any(Object))

    await productService.updateProduct(999, { name: 'Test 2' } as any)
    expect(mockApiClient.patch).toHaveBeenCalledWith('/products/999', expect.any(Object))

    await productService.deleteProduct(999)
    expect(mockApiClient.delete).toHaveBeenCalledWith('/products/999')
  })
})


