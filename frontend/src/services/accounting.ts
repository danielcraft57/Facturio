import { apiClient, type ApiResponse } from './api'

export interface Account {
  id: number
  code: string
  name: string
  type: string
}

export interface Journal {
  id: number
  code: string
  name: string
}

export interface JournalEntry {
  id: number
  journalId: number
  journal?: Journal
  date: string
  reference?: string
  memo?: string
  status: string
  totalDebit: number
  totalCredit: number
  lines: JournalLine[]
}

export interface JournalLine {
  id: number
  entryId: number
  accountId: number
  account?: Account
  description?: string
  debit: number
  credit: number
}

/** Balance API (champs plats renvoyés par le backend). */
export interface TrialBalanceRow {
  accountCode: string
  accountName: string
  debit: number
  credit: number
  balance: number
}

export interface GeneralLedgerAccountGroup {
  accountCode: string
  accountName: string
  lines: Array<{
    date: string
    journalCode: string
    reference?: string
    memo?: string
    debit: number
    credit: number
  }>
  totalDebit: number
  totalCredit: number
}

export interface AccountingMovement {
  lineId: number
  entryId: number
  date: string
  journalCode: string
  journalName: string
  reference?: string
  memo?: string
  accountCode: string
  accountName: string
  description?: string
  debit: number
  credit: number
  movementKind?: 'sale' | 'payment' | 'refund' | 'credit_note' | 'other'
  invoiceNumber?: string | null
}

export interface FinanceSummary {
  paidInvoicesCount: number
  revenueHt: number
  vatCollected: number
  totalTtc: number
  refundsCount?: number
  refundsTotal?: number
  netCashCollected?: number
  movementsCount: number
}

export interface SyncInvoicesResult {
  salesCreated: number
  paymentsCreated: number
  refundsCreated?: number
  skipped: number
  errors: string[]
}

export class AccountingService {
  private baseUrl = '/accounting'

  async getAccounts(): Promise<ApiResponse<Account[]>> {
    return apiClient.getCached<Account[]>(`${this.baseUrl}/accounts`, 10 * 60 * 1000)
  }

  async createAccount(data: { code: string; name: string; type: string }): Promise<ApiResponse<Account>> {
    return apiClient.post<Account>(`${this.baseUrl}/accounts`, data)
  }

  async getJournals(): Promise<ApiResponse<Journal[]>> {
    return apiClient.getCached<Journal[]>(`${this.baseUrl}/journals`, 10 * 60 * 1000)
  }

  async createJournal(data: { code: string; name: string }): Promise<ApiResponse<Journal>> {
    return apiClient.post<Journal>(`${this.baseUrl}/journals`, data)
  }

  async postEntry(data: {
    journalCode: string
    date?: string
    reference?: string
    memo?: string
    lines: Array<{ accountCode: string; description?: string; debit?: number; credit?: number }>
  }): Promise<ApiResponse<JournalEntry>> {
    return apiClient.post<JournalEntry>(`${this.baseUrl}/entries`, data)
  }

  async getTrialBalance(start?: string, end?: string): Promise<ApiResponse<TrialBalanceRow[]>> {
    const params = new URLSearchParams()
    if (start) params.append('start', start)
    if (end) params.append('end', end)
    const query = params.toString()
    return apiClient.getCached<TrialBalanceRow[]>(
      `${this.baseUrl}/reports/balance${query ? `?${query}` : ''}`,
      5 * 60 * 1000
    )
  }

  async getGeneralLedger(
    start?: string,
    end?: string,
    accountCode?: string
  ): Promise<ApiResponse<GeneralLedgerAccountGroup[]>> {
    const params = new URLSearchParams()
    if (start) params.append('start', start)
    if (end) params.append('end', end)
    if (accountCode) params.append('account', accountCode)
    const query = params.toString()
    return apiClient.getCached<GeneralLedgerAccountGroup[]>(
      `${this.baseUrl}/reports/general-ledger${query ? `?${query}` : ''}`,
      5 * 60 * 1000
    )
  }

  async getMovements(start?: string, end?: string): Promise<ApiResponse<AccountingMovement[]>> {
    const params = new URLSearchParams()
    if (start) params.append('start', start)
    if (end) params.append('end', end)
    const query = params.toString()
    return apiClient.get<AccountingMovement[]>(
      `${this.baseUrl}/movements${query ? `?${query}` : ''}`
    )
  }

  async getSummary(start?: string, end?: string): Promise<ApiResponse<FinanceSummary>> {
    const params = new URLSearchParams()
    if (start) params.append('start', start)
    if (end) params.append('end', end)
    const query = params.toString()
    return apiClient.get<FinanceSummary>(
      `${this.baseUrl}/summary${query ? `?${query}` : ''}`
    )
  }

  async syncFromInvoices(): Promise<ApiResponse<SyncInvoicesResult>> {
    return apiClient.post<SyncInvoicesResult>(`${this.baseUrl}/sync/invoices`, {})
  }

  async exportFEC(start?: string, end?: string): Promise<Blob> {
    const params = new URLSearchParams()
    if (start) params.append('start', start)
    if (end) params.append('end', end)
    const query = params.toString()
    
    const response = await apiClient.client.get(`${this.baseUrl}/exports/fec${query ? `?${query}` : ''}`, {
      responseType: 'blob',
    })

    return response.data
  }
}

export const accountingService = new AccountingService()

