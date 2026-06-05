import { apiClient } from './apiClient'
import type { Invoice, InvoiceFilters, InvoiceListResult } from '../types/invoice'
import { normalizeInvoiceFromApi } from '../utils/documentMappers'

function normalizeListResult(raw: InvoiceListResult): InvoiceListResult {
  const list = raw.invoices ?? (raw as unknown as { items?: Record<string, unknown>[] }).items ?? []
  return {
    ...raw,
    invoices: list.map((item) => normalizeInvoiceFromApi(item as unknown as Record<string, unknown>)),
  }
}

export const invoicesService = {
  async list(filters: InvoiceFilters = {}): Promise<InvoiceListResult> {
    const raw = await apiClient.get<InvoiceListResult>('/invoices', filters as Record<string, unknown>)
    return normalizeListResult(raw)
  },

  async getById(id: string): Promise<Invoice> {
    const raw = await apiClient.get<Record<string, unknown>>(`/invoices/${id}`)
    return normalizeInvoiceFromApi(raw)
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
