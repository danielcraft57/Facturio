import { apiClient } from './apiClient'
import type { DashboardStats } from '../types/dashboard'

export const dashboardService = {
  getStats(startDate?: string, endDate?: string): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/dashboard/stats', { startDate, endDate })
  },
}
