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

export interface BetaTesterStatus {
  active: boolean
  startedAt: string | null
  expiresAt: string | null
  daysRemaining: number | null
}

export interface BetaInviteValidation {
  valid: boolean
  message: string
  remainingSlots: number | null
}

export interface BetaProgramStats {
  maxSlots: number
  enrolledCount: number
  remainingSlots: number
  activeBetaCount: number
  durationDays: number
  programEndsAt: string | null
  programOpen: boolean
  codeMinLength: number
  codeMaxLength: number
  campaignCodes: Array<{
    code: string
    label: string | null
    redemptionCount: number
    maxRedemptions: number | null
    expiresAt: string | null
  }>
}

export interface BillingUsage {
  plan: SaasBillingPlan
  planLabel: string
  betaTester?: BetaTesterStatus | null
  limits: {
    plan: SaasBillingPlan
    label: string
    maxInvoicesPerMonth: number | null
    maxQuotesPerMonth: number | null
    maxEmailsPerMonth: number | null
    eInvoicing: boolean
    stripePayments: boolean
    multiUser: boolean
    publicApi: boolean
    accounting: boolean
    financeModule: boolean
    pdfWatermark: boolean
  }
  usage: {
    invoicesThisMonth: number
    quotesThisMonth: number
    emailsSentThisMonth: number
  }
  /** Mois calendaire courant ; le quota Free est remis à zéro à resetsAt. */
  billingPeriod?: {
    start: string
    end: string
    resetsAt: string
  }
  remainingInvoices: number | null
  remainingQuotes: number | null
  remainingEmails: number | null
  atLimit: boolean
  atQuoteLimit: boolean
  atEmailLimit: boolean
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

  getBetaProgramStats: (): Promise<ApiResponse<BetaProgramStats>> =>
    apiClient.get<BetaProgramStats>('billing/beta-program/stats'),

  validateBetaInvite: (code: string): Promise<ApiResponse<BetaInviteValidation>> =>
    apiClient.get<BetaInviteValidation>('billing/beta-invite/validate', {
      params: { code: code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') },
    }),

  redeemBetaInvite: (
    code: string,
  ): Promise<
    ApiResponse<{ plan: SaasBillingPlan; planLabel: string; expiresAt: string; durationDays: number }>
  > => apiClient.post('billing/beta-invite/redeem', { code: code.trim().toUpperCase() }),
}
