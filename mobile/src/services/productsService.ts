import { apiClient } from './apiClient'
import type { Product, ProductListResult } from '../types/product'

export interface ProductSuggestion {
  id: number
  name: string
  unitPrice?: number | null
  description?: string | null
}

export const productsService = {
  list(params: { page?: number; limit?: number; search?: string } = {}): Promise<ProductListResult> {
    return apiClient.get<ProductListResult>('/products', params)
  },

  async search(search: string, limit = 8): Promise<ProductSuggestion[]> {
    const result = await this.list({ search, limit, page: 1 })
    return result.items ?? result.products ?? []
  },

  create(data: { name: string; unitPrice?: number; description?: string }): Promise<Product> {
    return apiClient.post('/products', data)
  },

  delete(id: number): Promise<{ success?: boolean }> {
    return apiClient.delete(`/products/${id}`)
  },
}
