import { apiClient } from './apiClient'
import type { PayableDebtDetail, PayableDebtRow, PayablesDebtsListPage, PayablesSummary } from '../types/payables'

export const payablesService = {
  async getSummary(): Promise<PayablesSummary> {
    return apiClient.get<PayablesSummary>('/payables')
  },

  async listDebts(params: {
    page?: number
    limit?: number
    folder?: 'inbox' | 'sent' | 'archived'
    search?: string
  } = {}): Promise<PayablesDebtsListPage> {
    const raw = await apiClient.get<PayablesDebtsListPage>('/payables/debts', params as Record<string, unknown>)
    return {
      debts: raw.debts ?? [],
      total: raw.total ?? 0,
      page: raw.page ?? 1,
      pageSize: raw.pageSize ?? params.limit ?? 20,
    }
  },

  async getDebt(id: number): Promise<PayableDebtDetail> {
    return apiClient.get<PayableDebtDetail>(`/payables/debts/${id}`)
  },

  async recordPayment(
    debtId: number,
    data: { amount: number; date?: string; method?: string; notes?: string },
  ): Promise<PayableDebtRow> {
    return apiClient.post<PayableDebtRow>(`/payables/debts/${debtId}/payments`, data)
  },

  async sendDebt(debtId: number, data?: { to?: string; email?: string }): Promise<{ emailSent: boolean; sentTo: string }> {
    return apiClient.post(`/payables/debts/${debtId}/send`, data ?? {})
  },

  async archiveDebt(debtId: number): Promise<void> {
    await apiClient.post(`/payables/debts/${debtId}/archive`, {})
  },
}
