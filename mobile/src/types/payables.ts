export type PayableDebtRow = {
  id: number
  creditorId: number
  creditorName: string
  creditorEmail: string | null
  label: string
  totalAmount: number
  balance: number
  totalPaid: number
  currency: string
  dueDate: string | null
  status: string
  notes: string | null
  publicToken?: string | null
  createdAt: string
  archivedAt?: string | null
  starred?: boolean
  important?: boolean
  sentAt?: string | null
}

export type PayableDebtPayment = {
  id: number
  amount: number
  date: string
  method: string | null
  notes: string | null
}

export type PayableDebtDetail = PayableDebtRow & {
  publicToken: string | null
  payments: PayableDebtPayment[]
}

export type PayablesDebtsListPage = {
  debts: PayableDebtRow[]
  total: number
  page: number
  pageSize: number
}

export type PayablesSummary = {
  summary: {
    totalOutstanding: number
    creditorCount: number
    debtCount: number
  }
  creditors: Array<{
    id: number
    name: string
    email: string | null
    totalBalance: number
    debtCount: number
  }>
  debts: PayableDebtRow[]
}
