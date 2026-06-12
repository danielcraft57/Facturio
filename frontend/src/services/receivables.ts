import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export type ReceivableAgingBucket =
  | 'not_due'
  | 'days_0_30'
  | 'days_31_60'
  | 'days_61_90'
  | 'days_90_plus'

export type ReceivableDocumentKind = 'standard' | 'deposit' | 'remainder'

export type ReceivableAgingTotals = Record<ReceivableAgingBucket, number>

export type ReceivablesByKindTotals = Record<ReceivableDocumentKind, number>

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
  documentKind: ReceivableDocumentKind
  quoteId: string | null
  lastReminderAt: string | null
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

export type ReceivableInstallmentRow = {
  id: number
  sequence: number
  invoiceId: string
  invoiceNumber: string
  clientId: string
  clientName: string
  dueDate: string
  amount: number
  daysPastDue: number
  agingBucket: ReceivableAgingBucket
  overdue: boolean
  autoTracked: true
}

export type ReceivablesData = {
  summary: {
    totalOutstanding: number
    clientCount: number
    invoiceCount: number
    aging: ReceivableAgingTotals
    byKind: ReceivablesByKindTotals
    installmentOutstanding: number
    installmentCount: number
  }
  clients: ReceivableClientRow[]
  invoices: ReceivableInvoiceRow[]
  installmentReceivables: ReceivableInstallmentRow[]
}

export type ReceivableRemindResult = {
  sent: number
  skipped: number
  errors: string[]
}

export const AGING_BUCKET_LABELS: Record<ReceivableAgingBucket, string> = {
  not_due: 'À échoir',
  days_0_30: '0–30 j',
  days_31_60: '31–60 j',
  days_61_90: '61–90 j',
  days_90_plus: '+90 j',
}

export const RECEIVABLE_DOCUMENT_KIND_LABELS: Record<ReceivableDocumentKind, string> = {
  standard: 'Facture',
  deposit: 'Acompte',
  remainder: 'Solde',
}

export const receivablesService = {
  async getReceivables(params?: {
    start?: string
    end?: string
    kind?: ReceivableDocumentKind
  }): Promise<ReceivablesData> {
    const q = new URLSearchParams()
    if (params?.start) q.set('start', params.start)
    if (params?.end) q.set('end', params.end)
    if (params?.kind) q.set('kind', params.kind)
    const suffix = q.toString() ? `?${q}` : ''
    const res = await apiClient.get<ReceivablesData>(`/receivables${suffix}`)
    return unwrapApiPayload(res) as ReceivablesData
  },

  async remindOverdue(invoiceIds?: string[]): Promise<ReceivableRemindResult> {
    const res = await apiClient.post<ReceivableRemindResult>('/receivables/remind-overdue', {
      ...(invoiceIds?.length ? { invoiceIds } : {}),
    })
    return unwrapApiPayload(res) as ReceivableRemindResult
  },
}
