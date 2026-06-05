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
  chartData?: {
    revenueEvolution?: {
      labels: string[]
      datasets: Array<{ label: string; data: number[] }>
    }
    invoiceStatus?: {
      labels: string[]
      datasets: Array<{ data: number[] }>
    }
  }
}
