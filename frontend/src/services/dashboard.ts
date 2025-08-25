import { apiClient, type ApiResponse } from './api'

// Types pour les statistiques du dashboard
export interface DashboardStats {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  invoices: {
    total: number
    paid: number
    overdue: number
    draft: number
    sent: number
    thisMonth: number
    lastMonth: number
  }
  clients: {
    total: number
    active: number
    inactive: number
    prospects: number
    newThisMonth: number
  }
  topClients: Array<{
    client: {
      id: string
      name: string
    }
    revenue: number
  }>
  recentActivity: Array<{
    type: string
    message: string
    amount?: number
    date: string
  }>
  monthlyRevenue: Array<{
    month: string
    revenue: number
  }>
}

// Service pour le dashboard
export class DashboardService {
  private baseUrl = '/dashboard'

  // Récupérer les statistiques du dashboard
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.getCached<DashboardStats>(`${this.baseUrl}/stats`, 5 * 60 * 1000) // Cache 5 minutes
  }

  // Récupérer les statistiques en temps réel (sans cache)
  async getStatsRealtime(): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>(`${this.baseUrl}/stats`)
  }

  // Récupérer les statistiques par période
  async getStatsByPeriod(startDate: string, endDate: string): Promise<ApiResponse<DashboardStats>> {
    return apiClient.get<DashboardStats>(`${this.baseUrl}/stats?startDate=${startDate}&endDate=${endDate}`)
  }
}

// Instance singleton
export const dashboardService = new DashboardService()
