import { describe, it, expect, vi, beforeEach } from 'vitest'
import { productService } from './productService'
import { mockProductService } from './productService.mock'

vi.mock('./productService.mock', () => ({
  mockProductService: {
    getProducts: vi.fn(),
    getProduct: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
}))

describe('productService (mode mock en dev)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('délègue à mockProductService.getProducts en dev', async () => {
    ;(mockProductService.getProducts as any).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, limit: 10 },
    })

    const filters = { kind: 'SERVICE', search: 'WordPress' } as any
    await productService.getProducts(filters, 2, 5)

    expect(mockProductService.getProducts).toHaveBeenCalledWith(
      filters,
      2,
      5,
    )
  })

  it('délègue à mockProductService.create/update/delete en dev', async () => {
    ;(mockProductService.createProduct as any).mockResolvedValue({
      success: true,
      data: { id: 999, name: 'Test' },
    })
    ;(mockProductService.updateProduct as any).mockResolvedValue({
      success: true,
      data: { id: 999, name: 'Test 2' },
    })
    ;(mockProductService.deleteProduct as any).mockResolvedValue({
      success: true,
      data: true,
    })

    await productService.createProduct({ name: 'Test' } as any)
    expect(mockProductService.createProduct).toHaveBeenCalled()

    await productService.updateProduct(999, { name: 'Test 2' } as any)
    expect(mockProductService.updateProduct).toHaveBeenCalledWith(
      999,
      expect.objectContaining({ name: 'Test 2' }),
    )

    await productService.deleteProduct(999)
    expect(mockProductService.deleteProduct).toHaveBeenCalledWith(999)
  })
})


