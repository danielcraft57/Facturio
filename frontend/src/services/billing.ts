import { apiClient, type ApiResponse } from './api'

export type SaasBillingPlan = 'FREE' | 'PRO' | 'PRO_EFACTURE' | 'AGENCY'

export interface BillingUsage {
  plan: SaasBillingPlan
  planLabel: string
  limits: {
    plan: SaasBillingPlan
    label: string
    maxInvoicesPerMonth: number | null
    eInvoicing: boolean
    stripePayments: boolean
    prospection: boolean
    multiUser: boolean
  }
  usage: { invoicesThisMonth: number }
  remainingInvoices: number | null
  atLimit: boolean
}

export const billingService = {
  getUsage: (): Promise<ApiResponse<BillingUsage>> => apiClient.get<BillingUsage>('billing/usage'),

  createCheckout: (plan: 'PRO' | 'PRO_EFACTURE'): Promise<ApiResponse<{ url: string }>> =>
    apiClient.post<{ url: string }>('billing/checkout', { plan }),
}
