import { apiClient, type ApiResponse } from './api'

export interface Filing {
  id: number
  type: 'VAT_CA3' | 'VAT_CA12' | 'URSSAF_MONTHLY' | 'URSSAF_QUARTERLY' | 'IS' | 'CFE'
  status: 'draft' | 'calculated' | 'submitted' | 'paid'
  period: string
  periodStart: string
  periodEnd: string
  authority: string
  amountDue?: number
  amountPaid?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreateFilingData {
  type: Filing['type']
  period?: string
  periodStart?: string
  periodEnd?: string
  authority?: string
}

export class FilingsService {
  private baseUrl = '/filings'

  async getFilings(filters?: { period?: string; status?: string }): Promise<ApiResponse<Filing[]>> {
    const params = new URLSearchParams()
    if (filters?.period) params.append('period', filters.period)
    if (filters?.status) params.append('status', filters.status)
    const query = params.toString()
    return apiClient.getCached<Filing[]>(
      `${this.baseUrl}${query ? `?${query}` : ''}`,
      5 * 60 * 1000
    )
  }

  async getFiling(id: number): Promise<ApiResponse<Filing>> {
    return apiClient.getCached<Filing>(`${this.baseUrl}/${id}`, 5 * 60 * 1000)
  }

  async createFiling(data: CreateFilingData): Promise<ApiResponse<Filing>> {
    const response = await apiClient.post<Filing>(this.baseUrl, data)
    apiClient.invalidateCache(this.baseUrl)
    return response
  }

  async updateFiling(id: number, data: { status?: Filing['status']; notes?: string }): Promise<ApiResponse<Filing>> {
    const response = await apiClient.patch<Filing>(`${this.baseUrl}/${id}`, data)
    apiClient.invalidateCache(this.baseUrl)
    apiClient.invalidateCache(`${this.baseUrl}/${id}`)
    return response
  }

  async calculateFiling(id: number): Promise<ApiResponse<Filing>> {
    const response = await apiClient.post<Filing>(`${this.baseUrl}/${id}/calculate`)
    apiClient.invalidateCache(this.baseUrl)
    apiClient.invalidateCache(`${this.baseUrl}/${id}`)
    return response
  }

  async addPayment(id: number, data: { amount: number; date?: string; reference?: string; notes?: string }): Promise<ApiResponse<Filing>> {
    const response = await apiClient.post<Filing>(`${this.baseUrl}/${id}/payments`, data)
    apiClient.invalidateCache(this.baseUrl)
    apiClient.invalidateCache(`${this.baseUrl}/${id}`)
    return response
  }
}

export const filingsService = new FilingsService()

