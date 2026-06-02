import { apiClient } from './apiClient'
import type { InvoiceFilters, InvoiceListResult } from '../types/invoice'

export const invoicesService = {
  list(filters: InvoiceFilters = {}): Promise<InvoiceListResult> {
    return apiClient.get<InvoiceListResult>('/invoices', filters as Record<string, unknown>)
  },
}
