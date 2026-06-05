export interface Product {
  id: number
  name: string
  unitPrice?: number | null
  sku?: string | null
  description?: string | null
}

export interface ProductListResult {
  items?: Product[]
  products?: Product[]
  total: number
  page: number
  pageSize?: number
  limit?: number
}
