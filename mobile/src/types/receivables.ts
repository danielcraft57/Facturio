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

export type ReceivablesData = {
  summary: {
    totalOutstanding: number
    clientCount: number
    invoiceCount: number
    aging: ReceivableAgingTotals
    byKind: ReceivablesByKindTotals
  }
  clients: ReceivableClientRow[]
  invoices: ReceivableInvoiceRow[]
}

export type ReceivableRemindResult = {
  sent: number
  skipped: number
  errors: string[]
}
