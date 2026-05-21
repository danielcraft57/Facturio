import { apiClient, type ApiResponse } from './api'

// Types pour les factures
export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  discount?: number
  total: number
  totalWithTax: number
}

export interface Invoice {
  id: string
  number: string
  clientId: string
  client: {
    id: string
    name: string
    email: string
  }
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issueDate: string
  dueDate: string
  items: InvoiceItem[]
  subtotal: number
  taxTotal: number
  total: number
  currency: string
  notes?: string
  terms?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
}

export interface CreateInvoiceData {
  clientId?: string
  newClientName?: string
  issueDate: string
  dueDate: string
  items: Omit<InvoiceItem, 'id' | 'total' | 'totalWithTax'>[]
  notes?: string
  terms?: string
  currency?: string
  /** Déjà réglée sur un autre site / moyen externe */
  paidExternally?: boolean
  externalPaymentDate?: string
  externalPaymentMethod?: string
  clientEmail?: string
  /** Envoyer par email juste après la création */
  sendByEmailAfterCreate?: boolean
  sendToEmail?: string
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  id: string
}

export interface InvoiceFilters {
  search?: string
  status?: Invoice['status']
  clientId?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
  sortBy?: 'number' | 'issueDate' | 'dueDate' | 'total' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface InvoiceListResponse {
  invoices: Invoice[]
  items?: Invoice[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function unwrapApiPayload<T>(response: unknown): T {
  const raw: any = (response as any)?.data ?? response
  return (raw?.data ?? raw) as T
}

/** Normalise une facture renvoyée par l'API NestJS / Prisma. */
export function normalizeInvoiceFromApi(raw: Record<string, unknown>): Invoice {
  const client = (raw.client as Record<string, unknown>) ?? {}
  const status = String(raw.status ?? 'DRAFT').toLowerCase() as Invoice['status']
  return {
    id: String(raw.id ?? ''),
    number: String(raw.number ?? ''),
    clientId: String(raw.clientId ?? client.id ?? ''),
    client: {
      id: String(client.id ?? ''),
      name: String(client.name ?? client.companyName ?? 'Client'),
      email: String(client.email ?? ''),
    },
    status,
    issueDate: String(raw.date ?? raw.issueDate ?? new Date().toISOString()),
    dueDate: String(raw.dueDate ?? ''),
    items: ((raw.lines as unknown[]) ?? (raw.items as unknown[]) ?? []).map((ln: unknown) => {
      const line = ln as Record<string, unknown>
      const qty = Number(line.quantity ?? 0)
      const unit = Number(line.unitPrice ?? 0)
      const rate = Number(line.taxRate ?? 0)
      const total = Number(line.total ?? qty * unit * (1 + rate))
      return {
        id: String(line.id ?? ''),
        description: String(line.description ?? ''),
        quantity: qty,
        unitPrice: unit,
        taxRate: rate > 1 ? rate : rate * 100,
        total: qty * unit,
        totalWithTax: total,
      }
    }),
    subtotal: Number(raw.subtotal ?? 0),
    taxTotal: Number(raw.tax ?? raw.taxTotal ?? 0),
    total: Number(raw.total ?? 0),
    currency: String(raw.currency ?? 'EUR'),
    notes: raw.legalMention ? String(raw.legalMention) : undefined,
    terms: raw.terms ? String(raw.terms) : undefined,
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
    paidAt: raw.paidAt ? String(raw.paidAt) : undefined,
  }
}

export function parseInvoicesListResponse(response: unknown): Invoice[] {
  const payload = unwrapApiPayload<{ invoices?: unknown[]; items?: unknown[] }>(response)
  const list = Array.isArray(payload?.invoices)
    ? payload.invoices
    : Array.isArray(payload?.items)
      ? payload.items
      : []
  return list.map((row) => normalizeInvoiceFromApi(row as Record<string, unknown>))
}

export function toCreateInvoiceApiBody(data: CreateInvoiceData): Record<string, unknown> {
  const body: Record<string, unknown> = {
    dueDate: data.dueDate,
    currency: data.currency || 'EUR',
    lines: data.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate > 1 ? item.taxRate / 100 : item.taxRate,
    })),
  }
  if (data.paidExternally) {
    body.paidExternally = true
    body.status = 'PAID'
    if (data.externalPaymentDate) body.externalPaymentDate = data.externalPaymentDate
    if (data.externalPaymentMethod) body.externalPaymentMethod = data.externalPaymentMethod
  }
  if (data.clientId) body.clientId = Number(data.clientId)
  if (data.clientEmail?.trim()) body.clientEmail = data.clientEmail.trim()
  if (data.newClientName?.trim()) body.clientName = data.newClientName.trim()
  return body
}

// Service pour les factures
export class InvoiceService {
  private baseUrl = '/invoices'

  // Récupérer la liste des factures avec filtres
  async getInvoices(filters: InvoiceFilters = {}): Promise<ApiResponse<InvoiceListResponse>> {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    if (filters.clientId) params.append('clientId', filters.clientId)
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

    const queryString = params.toString()
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl

    return apiClient.getCached<InvoiceListResponse>(url, 2 * 60 * 1000) // Cache 2 minutes
  }

  // Récupérer une facture par ID
  async getInvoice(id: string): Promise<ApiResponse<Invoice>> {
    return apiClient.getCached<Invoice>(`${this.baseUrl}/${id}`, 5 * 60 * 1000) // Cache 5 minutes
  }

  // Créer une nouvelle facture (corps API NestJS)
  async createInvoiceFromApi(data: Record<string, unknown>): Promise<unknown> {
    const response = await apiClient.post(this.baseUrl, data)
    apiClient.invalidateCache('/invoices')
    return response
  }

  /** @deprecated Préférer createInvoiceFromApi + toCreateInvoiceApiBody */
  async createInvoice(data: CreateInvoiceData): Promise<ApiResponse<Invoice>> {
    return this.createInvoiceFromApi(toCreateInvoiceApiBody(data)) as Promise<ApiResponse<Invoice>>
  }

  // Mettre à jour une facture
  async updateInvoice(data: UpdateInvoiceData): Promise<ApiResponse<Invoice>> {
    const { id, ...updateData } = data
    const response = await apiClient.put<Invoice>(`${this.baseUrl}/${id}`, updateData)
    
    // Invalider les caches
    apiClient.invalidateCache('/invoices')
    apiClient.invalidateCache(`/invoices/${id}`)
    
    return response
  }

  // Supprimer une facture
  async deleteInvoice(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`${this.baseUrl}/${id}`)
    
    // Invalider les caches
    apiClient.invalidateCache('/invoices')
    apiClient.invalidateCache(`/invoices/${id}`)
    
    return response
  }

  // Envoyer une facture par email
  async sendInvoice(
    id: string,
    emailData?: { to?: string; updateClientEmail?: boolean },
  ): Promise<ApiResponse<unknown>> {
    const response = await apiClient.post<unknown>(`${this.baseUrl}/${id}/send`, emailData ?? {})
    
    // Mettre à jour le statut en cache
    apiClient.invalidateCache(`/invoices/${id}`)
    
    return response
  }

  // Marquer une facture comme payée
  async markAsPaid(id: string, paymentData?: { amount?: number; method?: string; date?: string }): Promise<ApiResponse<Invoice>> {
    const response = await apiClient.post<Invoice>(`${this.baseUrl}/${id}/pay`, paymentData)
    
    // Invalider les caches
    apiClient.invalidateCache('/invoices')
    apiClient.invalidateCache(`/invoices/${id}`)
    
    return response
  }

  // Annuler une facture
  async cancelInvoice(id: string, reason?: string): Promise<ApiResponse<Invoice>> {
    const response = await apiClient.post<Invoice>(`${this.baseUrl}/${id}/cancel`, { reason })
    
    // Invalider les caches
    apiClient.invalidateCache('/invoices')
    apiClient.invalidateCache(`/invoices/${id}`)
    
    return response
  }

  // Créer un avoir
  async createCreditNote(invoiceId: string, items: Array<{ itemId: string; quantity: number; reason?: string }>): Promise<ApiResponse<Invoice>> {
    const response = await apiClient.post<Invoice>(`${this.baseUrl}/${invoiceId}/credit-note`, { items })
    
    // Invalider les caches
    apiClient.invalidateCache('/invoices')
    apiClient.invalidateCache(`/invoices/${invoiceId}`)
    
    return response
  }

  // Dupliquer une facture
  async duplicateInvoice(id: string): Promise<ApiResponse<Invoice>> {
    const response = await apiClient.post<Invoice>(`${this.baseUrl}/${id}/duplicate`)
    
    // Invalider le cache des listes
    apiClient.invalidateCache('/invoices')
    
    return response
  }

  // Générer le PDF d'une facture
  async generatePDF(id: string): Promise<Blob> {
    const response = await apiClient.client.get(`${this.baseUrl}/${id}/pdf`, {
      responseType: 'blob',
    })
    const data = response.data
    if (data instanceof Blob) return data
    const nested = (data as { data?: Blob })?.data
    if (nested instanceof Blob) return nested
    throw new Error('Réponse PDF invalide')
  }

  // Exporter les factures en CSV
  async exportInvoices(filters?: InvoiceFilters): Promise<Blob> {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.clientId) params.append('clientId', filters.clientId)
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters?.dateTo) params.append('dateTo', filters.dateTo)
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

    const queryString = params.toString()
    const url = queryString ? `${this.baseUrl}/export?${queryString}` : `${this.baseUrl}/export`

    const response = await apiClient.client.get(url, {
      responseType: 'blob',
    })

    return response.data
  }

  // Récupérer les statistiques des factures
  async getInvoiceStats(): Promise<ApiResponse<{
    total: number
    totalAmount: number
    paid: number
    paidAmount: number
    overdue: number
    overdueAmount: number
    draft: number
    thisMonth: {
      count: number
      amount: number
    }
    lastMonth: {
      count: number
      amount: number
    }
    topClients: Array<{ client: { id: string; name: string }; total: number }>
  }>> {
    return apiClient.getCached(`${this.baseUrl}/stats`, 10 * 60 * 1000) // Cache 10 minutes
  }

  // Récupérer les factures en retard
  async getOverdueInvoices(): Promise<ApiResponse<Invoice[]>> {
    return apiClient.getCached<Invoice[]>(`${this.baseUrl}/overdue`, 5 * 60 * 1000) // Cache 5 minutes
  }

  /** Envoie une relance par email (facture déjà envoyée, non payée). */
  async sendReminder(id: string): Promise<ApiResponse<{ success: boolean; invoiceId: number; daysOverdue: number | null }>> {
    const response = await apiClient.post<{ success: boolean; invoiceId: number; daysOverdue: number | null }>(
      `${this.baseUrl}/${id}/remind`
    )
    apiClient.invalidateCache(`/invoices/${id}`)
    apiClient.invalidateCache('/invoices')
    return response
  }

  // Envoyer des relances automatiques (batch — route à venir)
  async sendReminders(invoiceIds: string[]): Promise<ApiResponse<{ sent: number; errors: string[] }>> {
    const response = await apiClient.post<{ sent: number; errors: string[] }>(`${this.baseUrl}/reminders`, {
      invoiceIds,
    })
    
    // Invalider les caches des factures concernées
    invoiceIds.forEach(id => apiClient.invalidateCache(`/invoices/${id}`))
    
    return response
  }
}

// Instance singleton
export const invoiceService = new InvoiceService()
