import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export type TreasuryDayPoint = {
  date: string
  inflows: number
  outflows: number
  net: number
  projectedBalance: number
}

export type TreasuryForecast = {
  asOf: string
  horizonDays: number
  openingCash: number
  closingProjected: number
  totalInflows: number
  totalOutflows: number
  points: TreasuryDayPoint[]
  upcomingReceivables: Array<{ dueDate: string; amount: number; label: string }>
  upcomingPayables: Array<{ dueDate: string; amount: number; label: string }>
}

/**
 * Client API trésorerie.
 */
export const treasuryService = {
  /**
   * Prévision de trésorerie.
   * @param days - Horizon en jours
   */
  async getForecast(days = 90): Promise<TreasuryForecast> {
    const res = await apiClient.get(`/treasury/forecast?days=${days}`)
    return unwrapApiPayload(res) as TreasuryForecast
  },
}
