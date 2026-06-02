export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface Quote {
  id: string
  number: string
  clientId: string
  client: {
    id: string
    name: string
    email?: string
  }
  status: QuoteStatus
  issueDate: string
  dueDate?: string
  total: number
  currency: string
  seenAt?: string | null
}

export interface QuoteListResult {
  quotes: Quote[]
  total: number
  page: number
  pageSize?: number
}

export interface QuoteFilters {
  search?: string
  status?: QuoteStatus
  page?: number
  limit?: number
}
