import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export type ClientMovementKind =
  | 'invoice'
  | 'payment'
  | 'refund'
  | 'credit_note'
  | 'credit_applied'
  | 'misc'
  | 'quote'

export type ClientMovement = {
  id: string
  kind: ClientMovementKind
  date: string
  label: string
  reference?: string
  amount: number
  direction: 'in' | 'out' | 'neutral'
  invoiceId?: string
  avoirId?: number
  quoteId?: string
}

export type ClientFinanceBalances = {
  totalInvoicedTtc: number
  totalPaidNet: number
  totalRefunded: number
  totalCreditsAvailable: number
  totalCreditsApplied: number
  outstandingBalance: number
}

export type ClientFinanceTaxes = {
  vatCollected: number
  vatCredited: number
  netVat: number
  revenueHt: number
}

export type ClientFinanceAvoir = {
  id: number
  number: string
  date: string
  status: string
  total: number
  appliedAmount: number
  balance: number
  isMisc: boolean
  invoiceId?: string | null
}

export type ClientFinanceData = {
  balances: ClientFinanceBalances
  taxes: ClientFinanceTaxes
  movements: ClientMovement[]
  avoirs: ClientFinanceAvoir[]
  invoiceCount: number
  quoteCount: number
  openInvoices: Array<{
    id: string
    number: string
    total: number
    balance: number
    status: string
    date: string
  }>
}

export const clientFinanceService = {
  async getFinance(
    clientId: string,
    params?: { start?: string; end?: string },
  ): Promise<ClientFinanceData> {
    const q = new URLSearchParams()
    if (params?.start) q.set('start', params.start)
    if (params?.end) q.set('end', params.end)
    const suffix = q.toString() ? `?${q}` : ''
    const res = await apiClient.get<ClientFinanceData>(`/clients/${clientId}/finance${suffix}`)
    return unwrapApiPayload<ClientFinanceData>(res)
  },

  async createMiscOperation(
    clientId: string,
    body: { label: string; amountTtc: number; kind?: string; notes?: string },
  ): Promise<unknown> {
    const res = await apiClient.post(`/clients/${clientId}/misc-operations`, body)
    apiClient.invalidateCache(`/clients/${clientId}/finance`)
    apiClient.invalidateCache('/avoirs')
    return unwrapApiPayload(res)
  },

  async createCredit(
    clientId: string,
    body: { label: string; amountTtc: number; notes?: string },
  ): Promise<unknown> {
    const res = await apiClient.post(`/clients/${clientId}/credits`, body)
    apiClient.invalidateCache(`/clients/${clientId}/finance`)
    apiClient.invalidateCache('/avoirs')
    return unwrapApiPayload(res)
  },
}

export function clientMovementKindLabel(kind: ClientMovementKind): string {
  switch (kind) {
    case 'invoice':
      return 'Facture'
    case 'payment':
      return 'Encaissement'
    case 'refund':
      return 'Remboursement'
    case 'credit_note':
      return 'Avoir'
    case 'credit_applied':
      return 'Imputation'
    case 'misc':
      return 'Op. diverse'
    case 'quote':
      return 'Devis'
    default:
      return kind
  }
}
