import { apiClient } from './apiClient'
import type { InvoiceFilters, InvoiceListResult } from '../types/invoice'

export const invoicesService = {
  list(filters: InvoiceFilters = {}): Promise<InvoiceListResult> {
    return apiClient.get<InvoiceListResult>('/invoices', filters as Record<string, unknown>)
  },

  getById(id: string): Promise<import('../types/invoice').Invoice> {
    return apiClient.get(`/invoices/${id}`)
  },

  sendByEmail(id: string, to?: string): Promise<{ success?: boolean; message?: string }> {
    return apiClient.post(`/invoices/${id}/send`, to ? { to } : {})
  },
}
