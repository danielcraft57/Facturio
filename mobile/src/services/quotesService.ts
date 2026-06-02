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
}
