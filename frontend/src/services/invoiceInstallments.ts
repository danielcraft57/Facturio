import { apiClient } from './api'
import { unwrapApiPayload } from './clients'
import type { ReceivableAgingBucket } from './receivables'

export type InvoiceInstallmentStatus = 'SCHEDULED' | 'PENDING' | 'PAID' | 'CANCELLED'

export interface InstallmentAccountingLink {
  entryId: number
  journalCode: string
  reference: string
  date: string
  memo: string | null
  kind: 'sale' | 'payment'
  posted: boolean
}

export interface InstallmentReceivableLink {
  outstanding: number
  agingBucket: ReceivableAgingBucket
  daysPastDue: number
  autoTracked: true
}

export interface InvoiceInstallment {
  id: number
  sequence: number
  amount: number
  dueDate: string
  status: InvoiceInstallmentStatus
  paymentId: number | null
  paidAt: string | null
  overdue: boolean
  receivable?: InstallmentReceivableLink | null
  accounting?: InstallmentAccountingLink | null
}

export interface InvoiceInstallmentInput {
  amount: number
  dueDate: string
}

export interface InvoiceInstallmentsFinanceResponse {
  installments: InvoiceInstallment[]
  saleAccounting: InstallmentAccountingLink | null
}

export const invoiceInstallmentsService = {
  async list(invoiceId: string): Promise<InvoiceInstallmentsFinanceResponse> {
    const res = await apiClient.get<InvoiceInstallmentsFinanceResponse | InvoiceInstallment[]>(
      `factures/${invoiceId}/installments`,
    )
    const payload = unwrapApiPayload(res)
    if (payload && typeof payload === 'object' && 'installments' in payload) {
      return payload as InvoiceInstallmentsFinanceResponse
    }
    const rows = Array.isArray(payload) ? payload : []
    return { installments: rows, saleAccounting: null }
  },

  async setSchedule(
    invoiceId: string,
    installments: InvoiceInstallmentInput[],
  ): Promise<InvoiceInstallment[]> {
    const res = await apiClient.put<InvoiceInstallment[]>(`factures/${invoiceId}/installments`, {
      installments,
    })
    return unwrapApiPayload(res) ?? []
  },

  async clear(invoiceId: string): Promise<void> {
    await apiClient.delete(`factures/${invoiceId}/installments`)
  },

  async remind(invoiceId: string, installmentId: number): Promise<void> {
    await apiClient.post(`factures/${invoiceId}/installments/${installmentId}/remind`, {})
  },

  async release(invoiceId: string, installmentId: number): Promise<void> {
    await apiClient.post(`factures/${invoiceId}/installments/${installmentId}/release`, {})
  },

  async previewEqual(
    invoiceId: string,
    total: number,
    count: number,
    firstDueDate: string,
    intervalMonths = 1,
  ): Promise<InvoiceInstallmentInput[]> {
    const res = await apiClient.post<InvoiceInstallmentInput[]>(
      `factures/${invoiceId}/installments/preview-equal`,
      { total, count, firstDueDate, intervalMonths },
    )
    return unwrapApiPayload(res) ?? []
  },
}
