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

  archive(id: string): Promise<{ success?: boolean; archivedAt?: string }> {
    return apiClient.post(`/invoices/${id}/archive`, {})
  },

  createQuickDraft(data: {
    clientId?: string
    clientName?: string
    dueDate: string
    lines: Array<{
      description: string
      quantity: number
      unitPrice: number
      taxRate?: number
    }>
    taxRate?: number
  }) {
    return apiClient.post('/invoices', {
      clientId: data.clientId,
      clientName: data.clientName,
      dueDate: data.dueDate,
      lines: data.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate ?? data.taxRate ?? 0.2,
      })),
      currency: 'EUR',
      status: 'DRAFT',
    })
  },
}
