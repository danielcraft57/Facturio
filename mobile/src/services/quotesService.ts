import { apiClient } from './apiClient'
import type { Quote, QuoteFilters, QuoteListResult } from '../types/quote'
import { normalizeQuoteFromApi } from '../utils/documentMappers'

function normalizeListResult(raw: QuoteListResult): QuoteListResult {
  const list = raw.quotes ?? (raw as unknown as { items?: Record<string, unknown>[] }).items ?? []
  return {
    ...raw,
    quotes: list.map((item) => normalizeQuoteFromApi(item as unknown as Record<string, unknown>)),
  }
}

export const quotesService = {
  async list(filters: QuoteFilters = {}): Promise<QuoteListResult> {
    const raw = await apiClient.get<QuoteListResult>('/quotes', filters as Record<string, unknown>)
    return normalizeListResult(raw)
  },

  async getById(id: string): Promise<Quote> {
    const raw = await apiClient.get<Record<string, unknown>>(`/quotes/${id}`)
    return normalizeQuoteFromApi(raw)
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
