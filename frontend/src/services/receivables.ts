import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export type ReceivableAgingBucket =
  | 'not_due'
  | 'days_0_30'
  | 'days_31_60'
  | 'days_61_90'
  | 'days_90_plus'

export type ReceivableAgingTotals = Record<ReceivableAgingBucket, number>

export type ReceivableInvoiceRow = {
  id: string
  number: string
  clientId: string
  clientName: string
  date: string
  dueDate: string | null
  total: number
  balance: number
  status: string
  daysPastDue: number
  agingBucket: ReceivableAgingBucket
}

export type ReceivableClientRow = {
  clientId: string
  clientName: string
  clientEmail: string | null
  totalBalance: number
  invoiceCount: number
  maxDaysPastDue: number
  aging: ReceivableAgingTotals
}

export type ReceivablesData = {
  summary: {
    totalOutstanding: number
    clientCount: number
    invoiceCount: number
    aging: ReceivableAgingTotals
  }
  clients: ReceivableClientRow[]
  invoices: ReceivableInvoiceRow[]
}

export const AGING_BUCKET_LABELS: Record<ReceivableAgingBucket, string> = {
  not_due: 'À échoir',
  days_0_30: '0–30 j',
  days_31_60: '31–60 j',
  days_61_90: '61–90 j',
  days_90_plus: '+90 j',
}

export const receivablesService = {
  async getReceivables(params?: { start?: string; end?: string }): Promise<ReceivablesData> {
    const q = new URLSearchParams()
    if (params?.start) q.set('start', params.start)
    if (params?.end) q.set('end', params.end)
    const suffix = q.toString() ? `?${q}` : ''
    const res = await apiClient.get<ReceivablesData>(`/receivables${suffix}`)
    return unwrapApiPayload(res) as ReceivablesData
  },
}
