import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export type UrssafCalculation = {
  ca: number
  rate: number
  contribution: number
  activity: string
  invoicesCount: number
  periodStart: string
  periodEnd: string
  thresholdExceeded?: boolean
  threshold?: number
}

export type UrssafContribution = {
  id: number
  type: string
  authority: string
  periodStart: string
  periodEnd: string
  dueDate: string
  status: string
  amountDue: number
  amountPaid?: number
}

/**
 * Client API URSSAF (cotisations micro / auto-entrepreneur).
 */
export const urssafService = {
  /**
   * Calcule la cotisation pour une période.
   */
  async calculate(periodStart: string, periodEnd: string): Promise<UrssafCalculation> {
    const res = await apiClient.post('/urssaf/calculate', { periodStart, periodEnd })
    return unwrapApiPayload(res) as UrssafCalculation
  },

  /**
   * Crée une déclaration URSSAF (ex. 2026-M01 ou 2026-Q1).
   */
  async createFiling(period: string): Promise<UrssafContribution & { calculation?: UrssafCalculation }> {
    const res = await apiClient.post('/urssaf/filing', { period })
    apiClient.invalidateCache('/urssaf')
    apiClient.invalidateCache('/filings')
    return unwrapApiPayload(res) as UrssafContribution & { calculation?: UrssafCalculation }
  },

  /**
   * Historique des cotisations / déclarations URSSAF.
   */
  async listContributions(): Promise<UrssafContribution[]> {
    const res = await apiClient.get('/urssaf/contributions')
    const raw = unwrapApiPayload(res)
    return Array.isArray(raw) ? raw : []
  },
}
