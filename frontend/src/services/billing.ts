import { apiClient, type ApiResponse } from './api'

export type SaasBillingPlan = 'FREE' | 'PRO' | 'PRO_EFACTURE' | 'AGENCY'

/** Rythme de facturation envoyé à `POST /billing/checkout` (voir doc Stripe Checkout). */
export type SaasCheckoutSchedule = 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'YEARLY_UPFRONT'

export interface BillingSubscriptionInfo {
  status: string | null
  /** Résiliation demandée : accès Pro jusqu'à currentPeriodEnd, sans renouvellement. */
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  canManagePortal: boolean
  hasRecurringSubscription: boolean
  hasActiveSubscription: boolean
}

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
  subscription: BillingSubscriptionInfo | null
}

export const billingService = {
  getUsage: (): Promise<ApiResponse<BillingUsage>> => apiClient.get<BillingUsage>('billing/usage'),

  createCheckout: (
    plan: 'PRO' | 'PRO_EFACTURE',
    billingSchedule: SaasCheckoutSchedule = 'MONTHLY',
  ): Promise<ApiResponse<{ url: string }>> =>
    apiClient.post<{ url: string }>('billing/checkout', { plan, billingSchedule }),

  createPortal: (): Promise<ApiResponse<{ url: string }>> =>
    apiClient.post<{ url: string }>('billing/portal', {}),

  /** Synchronise plan + résiliation depuis Stripe (checkout, portail, page abonnement). */
  syncSubscription: (): Promise<
    ApiResponse<{ synced: boolean; plan: SaasBillingPlan; subscriptionStatus: string | null }>
  > => apiClient.post('billing/sync-subscription', {}),

  /** Alias — même appel que syncSubscription. */
  syncAfterCheckout: (): Promise<
    ApiResponse<{ synced: boolean; plan: SaasBillingPlan; subscriptionStatus: string | null }>
  > => apiClient.post('billing/sync-after-checkout', {}),
}
