import { apiClient } from './apiClient'
import type {
  ReceivableDocumentKind,
  ReceivableRemindResult,
  ReceivablesData,
} from '../types/receivables'

export const receivablesService = {
  async getReceivables(params?: {
    start?: string
    end?: string
    kind?: ReceivableDocumentKind
  }): Promise<ReceivablesData> {
    return apiClient.get<ReceivablesData>('/receivables', params as Record<string, unknown>)
  },

  async remindOverdue(invoiceIds?: string[]): Promise<ReceivableRemindResult> {
    return apiClient.post<ReceivableRemindResult>('/receivables/remind-overdue', {
      ...(invoiceIds?.length ? { invoiceIds } : {}),
    })
  },
}
