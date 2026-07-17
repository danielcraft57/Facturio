import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export type Investor = {
  id: number
  name: string
  email: string | null
  phone: string | null
  type: 'INDIVIDUAL' | 'COMPANY' | 'FUND'
  notes: string | null
  _count?: { investments: number }
}

export type Investment = {
  id: number
  label: string
  type: string
  amount: number
  date: string
  ownershipPercent: number | null
  expectedReturnPercent: number | null
  maturityDate: string | null
  status: string
  notes: string | null
  investor: { id: number; name: string; type: string } | null
}

export type InvestmentSummary = {
  totalActive: number
  byType: Record<string, number>
  count: number
}

/**
 * Client API investisseurs / investissements.
 */
export const investmentsService = {
  async getSummary(): Promise<InvestmentSummary> {
    const res = await apiClient.get('/investments/summary')
    return unwrapApiPayload(res) as InvestmentSummary
  },

  async listInvestors(): Promise<Investor[]> {
    const res = await apiClient.get('/investments/investors')
    return unwrapApiPayload(res) as Investor[]
  },

  async createInvestor(payload: {
    name: string
    email?: string
    type?: string
    notes?: string
  }): Promise<Investor> {
    const res = await apiClient.post('/investments/investors', payload)
    apiClient.invalidateCache('/investments')
    return unwrapApiPayload(res) as Investor
  },

  async list(): Promise<Investment[]> {
    const res = await apiClient.get('/investments')
    return unwrapApiPayload(res) as Investment[]
  },

  async create(payload: {
    label: string
    amount: number
    date: string
    type?: string
    investorId?: number
    ownershipPercent?: number
    postAccounting?: boolean
    notes?: string
  }): Promise<Investment> {
    const res = await apiClient.post('/investments', payload)
    apiClient.invalidateCache('/investments')
    return unwrapApiPayload(res) as Investment
  },

  async close(id: number): Promise<Investment> {
    const res = await apiClient.post(`/investments/${id}/close`)
    apiClient.invalidateCache('/investments')
    return unwrapApiPayload(res) as Investment
  },
}
