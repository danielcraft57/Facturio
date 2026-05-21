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

describe('productService', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    ApiClient.resetInstanceForTests()
    vi.resetModules()
  })

  it('appelle l\'API pour getProducts', async () => {
    mockClient.get.mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, limit: 10 },
    })
    const { productService } = await import('./productService')

    await productService.getProducts({ kind: 'SERVICE', search: 'WordPress' } as never, 2, 5)

    expect(mockClient.get).toHaveBeenCalledWith(
      expect.stringContaining('/products'),
    )
  })

  it('appelle l\'API pour create/update/delete', async () => {
    mockClient.post.mockResolvedValue({ success: true, data: { id: 999, name: 'Test' } })
    mockClient.patch.mockResolvedValue({ success: true, data: { id: 999, name: 'Test 2' } })
    mockClient.delete.mockResolvedValue({ success: true, data: true })
    const { productService } = await import('./productService')

    await productService.createProduct({ name: 'Test' } as never)
    expect(mockClient.post).toHaveBeenCalledWith('/products', expect.any(Object))

    await productService.updateProduct(999, { name: 'Test 2' } as never)
    expect(mockClient.patch).toHaveBeenCalledWith('/products/999', expect.any(Object))

    await productService.deleteProduct(999)
    expect(mockClient.delete).toHaveBeenCalledWith('/products/999')
  })
})
