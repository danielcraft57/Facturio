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

export interface TrialBalance {
  account: Account
  openingDebit: number
  openingCredit: number
  periodDebit: number
  periodCredit: number
  closingDebit: number
  closingCredit: number
}

export interface GeneralLedgerEntry {
  date: string
  journal: string
  reference?: string
  description?: string
  debit: number
  credit: number
  balance: number
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

  async getTrialBalance(start?: string, end?: string): Promise<ApiResponse<TrialBalance[]>> {
    const params = new URLSearchParams()
    if (start) params.append('start', start)
    if (end) params.append('end', end)
    const query = params.toString()
    return apiClient.getCached<TrialBalance[]>(
      `${this.baseUrl}/reports/balance${query ? `?${query}` : ''}`,
      5 * 60 * 1000
    )
  }

  async getGeneralLedger(start?: string, end?: string, accountCode?: string): Promise<ApiResponse<GeneralLedgerEntry[]>> {
    const params = new URLSearchParams()
    if (start) params.append('start', start)
    if (end) params.append('end', end)
    if (accountCode) params.append('account', accountCode)
    const query = params.toString()
    return apiClient.getCached<GeneralLedgerEntry[]>(
      `${this.baseUrl}/reports/general-ledger${query ? `?${query}` : ''}`,
      5 * 60 * 1000
    )
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

