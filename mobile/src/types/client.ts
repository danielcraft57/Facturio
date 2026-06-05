export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  companyName?: string
  city?: string
  country?: string
  createdAt?: string
}

export interface ClientListResult {
  items?: Client[]
  clients?: Client[]
  total: number
  page: number
  pageSize?: number
  limit?: number
}
