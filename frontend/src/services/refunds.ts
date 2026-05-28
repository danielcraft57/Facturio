import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export interface Refund {
  id: number
  invoiceId: string
  paymentId: number | null
  amount: number
  date: string
  method?: string | null
  reason?: string | null
  notes?: string | null
  stripeRefundId?: string | null
  status: string
  createdAt: string
}

export interface PaymentWithRefundInfo {
  id: number
  amount: number
  date: string
  method?: string
  notes?: string
  refundedAmount?: number
  refundableAmount?: number
}

export interface CreateRefundPayload {
  amount: number
  paymentId?: number
  date?: string
  method?: string
  reason?: string
  notes?: string
  refundViaStripe?: boolean
}

export interface CancelDepositPayload {
  reason?: string
  refundViaStripe?: boolean
  /** Crée un avoir (crédit client) au lieu d'un remboursement. */
  creditOnly?: boolean
}

export interface CancelDepositResult {
  depositInvoiceId: string
  depositNumber: string
  remainderInvoiceId: string | null
  remainderNumber: string | null
  refunds: Refund[]
  avoir: { id: number; number: string }
}

export interface RefundListItem extends Refund {
  invoiceNumber?: string
  clientName?: string
  paymentMethod?: string | null
}

export interface RefundListResponse {
  data: RefundListItem[]
  pagination: { page: number; pageSize: number; total: number; totalPages: number }
}

export const refundsService = {
  async list(params?: { start?: string; end?: string; page?: number; pageSize?: number }): Promise<RefundListResponse> {
    const q = new URLSearchParams()
    if (params?.start) q.set('start', params.start)
    if (params?.end) q.set('end', params.end)
    if (params?.page) q.set('page', String(params.page))
    if (params?.pageSize) q.set('pageSize', String(params.pageSize))
    const res = await apiClient.get<RefundListResponse>(`/refunds${q.toString() ? `?${q}` : ''}`)
    return unwrapApiPayload<RefundListResponse>(res) ?? {
      data: [],
      pagination: { page: 1, pageSize: 25, total: 0, totalPages: 0 },
    }
  },

  async listByInvoice(invoiceId: string): Promise<Refund[]> {
    const res = await apiClient.get<Refund[]>(`/invoices/${invoiceId}/refunds`)
    return unwrapApiPayload<Refund[]>(res) ?? []
  },

  async createOnInvoice(invoiceId: string, payload: CreateRefundPayload): Promise<Refund> {
    const res = await apiClient.post<Refund>(`/invoices/${invoiceId}/refunds`, payload)
    apiClient.invalidateCache('/invoices')
    apiClient.invalidateCache(`/invoices/${invoiceId}`)
    return unwrapApiPayload<Refund>(res)
  },

  async createOnPayment(paymentId: number, payload: CreateRefundPayload): Promise<Refund> {
    const res = await apiClient.post<Refund>(`/refunds/payments/${paymentId}`, payload)
    apiClient.invalidateCache('/invoices')
    return unwrapApiPayload<Refund>(res)
  },

  async cancelDeposit(invoiceId: string, payload?: CancelDepositPayload): Promise<CancelDepositResult> {
    const res = await apiClient.post<CancelDepositResult>(`/invoices/${invoiceId}/cancel-deposit`, payload ?? {})
    apiClient.invalidateCache('/invoices')
    apiClient.invalidateCache(`/invoices/${invoiceId}`)
    return unwrapApiPayload<CancelDepositResult>(res)
  },
}
