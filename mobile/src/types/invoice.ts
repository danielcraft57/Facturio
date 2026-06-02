export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice {
  id: string
  number: string
  clientId: string
  client: {
    id: string
    name: string
    email?: string
  }
  status: InvoiceStatus
  issueDate: string
  dueDate?: string
  total: number
  currency: string
  seenAt?: string | null
}

export interface InvoiceListResult {
  invoices: Invoice[]
  total: number
  page: number
  pageSize?: number
  limit?: number
}

export interface InvoiceFilters {
  search?: string
  status?: InvoiceStatus
  page?: number
  limit?: number
}
