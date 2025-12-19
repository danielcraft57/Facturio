import { apiClient, type ApiResponse } from './api'

export interface Plan {
  id: number
  productId: number
  name: string
  amount: number
  currency: string
  interval: 'MONTH' | 'YEAR'
  trialDays?: number | null
  metered?: boolean
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: number
  clientId: number
  planId: number
  quantity: number
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING'
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  cancelledAt?: string | null
  plan?: Plan
  client?: {
    id: number
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreatePlanData {
  productId: number
  name: string
  amount: number
  currency?: string
  interval: 'MONTH' | 'YEAR'
  trialDays?: number | null
  metered?: boolean
}

export interface CreateSubscriptionData {
  clientId: number
  planId: number
  quantity?: number
  startDate?: string
}

export class SubscriptionsService {
  private baseUrl = '/subscriptions'

  // Plans
  async getPlans(): Promise<ApiResponse<Plan[]>> {
    return apiClient.getCached<Plan[]>(`${this.baseUrl}/plans`, 5 * 60 * 1000)
  }

  async createPlan(data: CreatePlanData): Promise<ApiResponse<Plan>> {
    return apiClient.post<Plan>(`${this.baseUrl}/plans`, data)
  }

  async updatePlan(id: number, data: Partial<CreatePlanData>): Promise<ApiResponse<Plan>> {
    return apiClient.patch<Plan>(`${this.baseUrl}/plans/${id}`, data)
  }

  async deletePlan(id: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`${this.baseUrl}/plans/${id}`)
  }

  // Subscriptions
  async getSubscriptions(): Promise<ApiResponse<Subscription[]>> {
    return apiClient.getCached<Subscription[]>(this.baseUrl, 2 * 60 * 1000)
  }

  async getSubscription(id: number): Promise<ApiResponse<Subscription>> {
    return apiClient.getCached<Subscription>(`${this.baseUrl}/${id}`, 5 * 60 * 1000)
  }

  async createSubscription(data: CreateSubscriptionData): Promise<ApiResponse<Subscription>> {
    const response = await apiClient.post<Subscription>(this.baseUrl, data)
    apiClient.invalidateCache(this.baseUrl)
    return response
  }

  async updateSubscription(id: number, data: Partial<CreateSubscriptionData>): Promise<ApiResponse<Subscription>> {
    const response = await apiClient.patch<Subscription>(`${this.baseUrl}/${id}`, data)
    apiClient.invalidateCache(this.baseUrl)
    apiClient.invalidateCache(`${this.baseUrl}/${id}`)
    return response
  }

  async cancelAtPeriodEnd(id: number): Promise<ApiResponse<Subscription>> {
    const response = await apiClient.post<Subscription>(`${this.baseUrl}/${id}/cancel-at-period-end`)
    apiClient.invalidateCache(this.baseUrl)
    apiClient.invalidateCache(`${this.baseUrl}/${id}`)
    return response
  }

  async cancelNow(id: number): Promise<ApiResponse<Subscription>> {
    const response = await apiClient.post<Subscription>(`${this.baseUrl}/${id}/cancel-now`)
    apiClient.invalidateCache(this.baseUrl)
    apiClient.invalidateCache(`${this.baseUrl}/${id}`)
    return response
  }

  // Analytics
  async getMRR(): Promise<ApiResponse<number>> {
    return apiClient.getCached<number>(`${this.baseUrl}/analytics/mrr`, 10 * 60 * 1000)
  }

  async getARR(): Promise<ApiResponse<number>> {
    return apiClient.getCached<number>(`${this.baseUrl}/analytics/arr`, 10 * 60 * 1000)
  }
}

export const subscriptionsService = new SubscriptionsService()

