import { apiClient } from './api'
import { unwrapApiPayload } from './clients'
import type { EmailEngagement } from '../modules/documents/documentEmailEngagement'
import type { DocumentFolder, DocumentFolderCounts } from '../types/documentFolders'
import type { DocumentFlags } from '../types/documentFolders'

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
  emailEngagement: EmailEngagement | null
  archivedAt?: string | null
  starred?: boolean
  important?: boolean
  snoozedUntil?: string | null
  seenAt?: string | null
  sentAt?: string | null
  tags?: string[]
}

export type PayablesDebtsListPage = {
  debts: PayableDebtRow[]
  total: number
  page: number
  pageSize: number
  folderCounts?: DocumentFolderCounts
}

export function parsePayablesDebtsListPage(raw: unknown): PayablesDebtsListPage {
  const payload = unwrapApiPayload(raw) as Record<string, unknown>
  return {
    debts: (payload.debts as PayableDebtRow[]) ?? [],
    total: Number(payload.total ?? 0),
    page: Number(payload.page ?? 1),
    pageSize: Number(payload.limit ?? payload.pageSize ?? 30),
    folderCounts: payload.folderCounts as DocumentFolderCounts | undefined,
  }
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

export type PublicPayableDebtView = {
  label: string
  totalAmount: number
  balance: number
  totalPaid: number
  currency: string
  dueDate: string | null
  notes: string | null
  status: string
  creditorName: string
  issuerName: string
  createdAt: string
}

export type PayablesData = {
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

export type PayableCreditor = {
  id: number
  name: string
  email: string | null
  notes: string | null
}

function buildDebtsListUrl(params: {
  page?: number
  limit?: number
  folder?: DocumentFolder
  search?: string
  includeFolderCounts?: boolean
}): string {
  const sp = new URLSearchParams()
  if (params.folder) sp.append('folder', params.folder)
  if (params.search) sp.append('search', params.search)
  if (params.page) sp.append('page', String(params.page))
  if (params.limit) sp.append('limit', String(params.limit))
  if (params.includeFolderCounts) sp.append('includeFolderCounts', '1')
  const qs = sp.toString()
  return qs ? `/payables/debts?${qs}` : '/payables/debts'
}

export const payablesService = {
  buildDebtsListUrl,

  async getSummary(): Promise<PayablesData> {
    const res = await apiClient.get<PayablesData>('/payables')
    return unwrapApiPayload(res) as PayablesData
  },

  async listDebts(params: {
    page?: number
    limit?: number
    folder?: DocumentFolder
    search?: string
    includeFolderCounts?: boolean
  }): Promise<PayablesDebtsListPage> {
    const res = await apiClient.getCached(buildDebtsListUrl(params), 2 * 60 * 1000)
    return parsePayablesDebtsListPage(res)
  },

  async getArchivedDebts(): Promise<{ groups: unknown[]; total: number }> {
    const res = await apiClient.get('/payables/debts/archives')
    return unwrapApiPayload(res) as { groups: unknown[]; total: number }
  },

  async updateDebtFlags(debtId: number, patch: DocumentFlags): Promise<PayableDebtRow> {
    const res = await apiClient.patch<PayableDebtRow>(`/payables/debts/${debtId}/flags`, patch)
    apiClient.invalidateCache('/payables')
    return unwrapApiPayload(res) as PayableDebtRow
  },

  async archiveDebt(debtId: number): Promise<void> {
    await apiClient.post(`/payables/debts/${debtId}/archive`, {})
    apiClient.invalidateCache('/payables')
  },

  async restoreDebt(debtId: number): Promise<void> {
    await apiClient.post(`/payables/debts/${debtId}/restore`, {})
    apiClient.invalidateCache('/payables')
  },

  async getDebt(id: number): Promise<PayableDebtDetail> {
    const res = await apiClient.get<PayableDebtDetail>(`/payables/debts/${id}`)
    return unwrapApiPayload(res) as PayableDebtDetail
  },

  async listCreditors(): Promise<PayableCreditor[]> {
    const res = await apiClient.get<PayableCreditor[]>('/payables/creditors')
    return unwrapApiPayload(res) as PayableCreditor[]
  },

  async createCreditor(data: { name: string; email?: string; notes?: string }): Promise<PayableCreditor> {
    const res = await apiClient.post<PayableCreditor>('/payables/creditors', data)
    apiClient.invalidateCache('/payables')
    return unwrapApiPayload(res) as PayableCreditor
  },

  async createDebt(data: {
    creditorId: number
    label: string
    totalAmount: number
    dueDate?: string
    notes?: string
  }): Promise<PayableDebtRow> {
    const res = await apiClient.post<PayableDebtRow>('/payables/debts', data)
    apiClient.invalidateCache('/payables')
    return unwrapApiPayload(res) as PayableDebtRow
  },

  async cancelDebt(debtId: number): Promise<PayableDebtRow> {
    const res = await apiClient.post<PayableDebtRow>(`/payables/debts/${debtId}/cancel`, {})
    apiClient.invalidateCache('/payables')
    apiClient.invalidateCache(`/payables/debts/${debtId}`)
    return unwrapApiPayload(res) as PayableDebtRow
  },

  async recordPayment(
    debtId: number,
    data: { amount: number; date?: string; method?: string; notes?: string },
  ): Promise<PayableDebtRow> {
    const res = await apiClient.post<PayableDebtRow>(`/payables/debts/${debtId}/payments`, data)
    apiClient.invalidateCache('/payables')
    apiClient.invalidateCache(`/payables/debts/${debtId}`)
    return unwrapApiPayload(res) as PayableDebtRow
  },

  async preparePublicLink(debtId: number): Promise<{ publicToken: string; url: string }> {
    const res = await apiClient.post<{ publicToken: string; url: string }>(
      `/payables/debts/${debtId}/public-link`,
      {},
    )
    return unwrapApiPayload(res) as { publicToken: string; url: string }
  },

  async sendPaymentNotice(
    debtId: number,
    data: {
      paymentAmount: number
      email?: string
      to?: string
      updateClientEmail?: boolean
      copyToSelf?: boolean
      additionalRecipients?: string
    },
  ): Promise<{ emailSent: boolean; sentTo: string; publicToken?: string; url?: string }> {
    const res = await apiClient.post<{
      emailSent: boolean
      sentTo: string
      publicToken?: string
      url?: string
    }>(`/payables/debts/${debtId}/send-payment-notice`, data)
    apiClient.invalidateCache('/payables')
    apiClient.invalidateCache(`/payables/debts/${debtId}`)
    const payload = unwrapApiPayload(res) as {
      emailSent: boolean
      sentTo: string
      publicToken?: string
      url?: string
    }
    if (payload.publicToken && typeof window !== 'undefined') {
      return { ...payload, url: `${window.location.origin}/dette/${payload.publicToken}` }
    }
    return payload
  },

  async sendDebt(
    debtId: number,
    data?: {
      email?: string
      to?: string
      updateClientEmail?: boolean
      copyToSelf?: boolean
      additionalRecipients?: string
    },
  ): Promise<{ emailSent: boolean; sentTo: string; publicToken?: string; url?: string }> {
    const res = await apiClient.post<{
      emailSent: boolean
      sentTo: string
      publicToken?: string
      url?: string
    }>(`/payables/debts/${debtId}/send`, data ?? {})
    apiClient.invalidateCache('/payables')
    apiClient.invalidateCache(`/payables/debts/${debtId}`)
    const payload = unwrapApiPayload(res) as {
      emailSent: boolean
      sentTo: string
      publicToken?: string
    }
    if (payload.publicToken && typeof window !== 'undefined') {
      return { ...payload, url: `${window.location.origin}/dette/${payload.publicToken}` }
    }
    return payload
  },
}
