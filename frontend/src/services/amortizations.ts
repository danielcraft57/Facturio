import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export type Amortization = {
  id: number
  assetName: string
  assetDescription: string | null
  purchaseDate: string
  purchaseAmount: number
  residualValue: number
  method: 'LINEAR' | 'DECLINING' | 'EXCEPTIONAL'
  duration: number
  coefficient: number | null
  startYear: number
  endYear: number | null
  schedule: Array<{ year: number; amount: number }> | null
}

/**
 * Client API amortissements (module taxes).
 */
export const amortizationsService = {
  async list(year?: number): Promise<Amortization[]> {
    const q = year != null ? `?year=${year}` : ''
    const res = await apiClient.get(`/taxes/amortizations/list${q}`)
    return unwrapApiPayload(res) as Amortization[]
  },

  async totals(year: number): Promise<{ year: number; total: number }> {
    const res = await apiClient.get(`/taxes/amortizations/totals/${year}`)
    return unwrapApiPayload(res) as { year: number; total: number }
  },

  async create(payload: {
    assetName: string
    assetDescription?: string
    purchaseDate: string
    purchaseAmount: number
    residualValue?: number
    method: 'LINEAR' | 'DECLINING' | 'EXCEPTIONAL'
    duration: number
    coefficient?: number
  }): Promise<Amortization> {
    const res = await apiClient.post('/taxes/amortizations', payload)
    apiClient.invalidateCache('/taxes/amortizations')
    return unwrapApiPayload(res) as Amortization
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/taxes/amortizations/${id}`)
    apiClient.invalidateCache('/taxes/amortizations')
  },

  /**
   * Comptabilise la dotation d'un bien pour une année (681/281).
   */
  async postYear(id: number, year: number) {
    const res = await apiClient.post(`/taxes/amortizations/${id}/post/${year}`)
    apiClient.invalidateCache('/taxes/amortizations')
    apiClient.invalidateCache('/accounting')
    return unwrapApiPayload(res)
  },

  /**
   * Comptabilise toutes les dotations de l'année.
   */
  async postAllYear(year: number) {
    const res = await apiClient.post(`/taxes/amortizations/post-year/${year}`)
    apiClient.invalidateCache('/taxes/amortizations')
    apiClient.invalidateCache('/accounting')
    return unwrapApiPayload(res) as {
      year: number
      postedCount: number
      skippedCount: number
      totalAmount: number
    }
  },
}
