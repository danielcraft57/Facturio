import { apiClient, type ApiResponse } from './api'
import { unwrapApiPayload } from './clients'

export type InvoiceInstallmentStatus = 'PENDING' | 'PAID' | 'CANCELLED'

export interface InvoiceInstallment {
  id: number
  sequence: number
  amount: number
  dueDate: string
  status: InvoiceInstallmentStatus
  paymentId: number | null
  paidAt: string | null
  overdue: boolean
}

export interface InvoiceInstallmentInput {
  amount: number
  dueDate: string
}

export const invoiceInstallmentsService = {
  async list(invoiceId: string): Promise<InvoiceInstallment[]> {
    const res = await apiClient.get<InvoiceInstallment[]>(`factures/${invoiceId}/installments`)
    return unwrapApiPayload(res) ?? []
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
