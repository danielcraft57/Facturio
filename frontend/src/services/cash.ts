import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export type CashRegister = {
  id: number
  name: string
  currency: string
  openingBalance: number
  currentBalance: number
  isActive: boolean
  notes: string | null
  _count?: { movements: number }
}

export type CashMovement = {
  id: number
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  amount: number
  date: string
  label: string
  category: string | null
  reference: string | null
  notes: string | null
}

/**
 * Client API caisse.
 */
export const cashService = {
  async listRegisters(): Promise<CashRegister[]> {
    const res = await apiClient.get('/cash/registers')
    return unwrapApiPayload(res) as CashRegister[]
  },

  async createRegister(payload: {
    name: string
    openingBalance?: number
    notes?: string
  }): Promise<CashRegister> {
    const res = await apiClient.post('/cash/registers', payload)
    apiClient.invalidateCache('/cash')
    return unwrapApiPayload(res) as CashRegister
  },

  async getRegister(id: number): Promise<CashRegister & { movements: CashMovement[] }> {
    const res = await apiClient.get(`/cash/registers/${id}`)
    return unwrapApiPayload(res) as CashRegister & { movements: CashMovement[] }
  },

  async addMovement(
    registerId: number,
    payload: {
      type: 'IN' | 'OUT' | 'ADJUSTMENT'
      amount: number
      label: string
      category?: string
      notes?: string
      date?: string
    },
    postAccounting = false,
  ) {
    const res = await apiClient.post(
      `/cash/registers/${registerId}/movements?postAccounting=${postAccounting}`,
      payload,
    )
    apiClient.invalidateCache('/cash')
    return unwrapApiPayload(res)
  },
}
