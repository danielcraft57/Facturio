import { apiClient } from './apiClient'
import type { QuoteFilters, QuoteListResult } from '../types/quote'

export const quotesService = {
  list(filters: QuoteFilters = {}): Promise<QuoteListResult> {
    return apiClient.get<QuoteListResult>('/quotes', filters as Record<string, unknown>)
  },

  getById(id: string): Promise<import('../types/quote').Quote> {
    return apiClient.get(`/quotes/${id}`)
  },

  sendByEmail(id: string, to?: string): Promise<{ success?: boolean; message?: string }> {
    return apiClient.post(`/quotes/${id}/send`, to ? { to } : {})
  },

  accept(id: string): Promise<{ success?: boolean; message?: string }> {
    return apiClient.post(`/quotes/${id}/accept`, {})
  },

  reject(id: string): Promise<{ success?: boolean; message?: string }> {
    return apiClient.post(`/quotes/${id}/reject`, {})
  },

  archive(id: string): Promise<{ success?: boolean; archivedAt?: string }> {
    return apiClient.post(`/quotes/${id}/archive`, {})
  },

  createQuickDraft(data: {
    clientId: string
    expiryDate?: string
    lines: Array<{
      description: string
      quantity: number
      unitPrice: number
      taxRate?: number
    }>
    taxRate?: number
  }) {
    return apiClient.post('/quotes', {
      clientId: data.clientId,
      expiryDate: data.expiryDate,
      lines: data.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate ?? data.taxRate ?? 0.2,
      })),
      status: 'DRAFT',
    })
  },
}
