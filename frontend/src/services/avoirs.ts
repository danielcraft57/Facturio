import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export interface AvoirLine {
  id: number
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
}

export interface AvoirApplication {
  id: number
  invoiceId: string
  amount: number
  appliedAt: string
  invoice?: { id: string; number: string }
}

export interface Avoir {
  id: number
  number: string
  date: string
  status: string
  clientId: string
  invoiceId?: string | null
  subtotal: number
  tax: number
  total: number
  appliedAmount: number
  balance: number
  memo?: string
  client?: { id: string; name: string }
  invoice?: { id: string; number: string } | null
  lines?: AvoirLine[]
  applications?: AvoirApplication[]
}

export interface AvoirListResponse {
  data: Avoir[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export const avoirsService = {
  async list(params?: { page?: number; pageSize?: number; search?: string }): Promise<AvoirListResponse> {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.pageSize) q.set('pageSize', String(params.pageSize))
    if (params?.search) q.set('search', params.search)
    const res = await apiClient.get<AvoirListResponse>(`/avoirs${q.toString() ? `?${q}` : ''}`)
    return unwrapApiPayload<AvoirListResponse>(res) ?? {
      data: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    }
  },

  async getOne(id: number): Promise<Avoir> {
    const res = await apiClient.get<Avoir>(`/avoirs/${id}`)
    return unwrapApiPayload<Avoir>(res)
  },

  async apply(avoirId: number, invoiceId: string, amount: number): Promise<Avoir> {
    const res = await apiClient.post<Avoir>(`/avoirs/${avoirId}/apply`, { invoiceId, amount })
    apiClient.invalidateCache('/avoirs')
    apiClient.invalidateCache('/invoices')
    return unwrapApiPayload<Avoir>(res)
  },
}
