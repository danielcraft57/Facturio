import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { getApiBaseUrl, unwrapApi } from '../utils/api'
import { getAuthToken, clearAuthSession } from './sessionStorage'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

class ApiClient {
  private client: AxiosInstance
  private onUnauthorized?: () => void

  constructor() {
    this.client = axios.create({
      baseURL: getApiBaseUrl(),
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    })

    this.client.interceptors.request.use(async (config) => {
      const token = await getAuthToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    this.client.interceptors.response.use(
      (res) => res,
      async (error: AxiosError<{ message?: string | string[] }>) => {
        const status = error.response?.status ?? 0
        if (status === 401) {
          await clearAuthSession()
          this.onUnauthorized?.()
        }
        const msg = error.response?.data?.message
        const message = Array.isArray(msg) ? msg.join(', ') : msg ?? error.message
        throw new ApiError(status, message)
      },
    )
  }

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const res = await this.client.get(url, { params })
    return unwrapApi<T>(res)
  }

  async post<T>(url: string, body?: unknown): Promise<T> {
    const res = await this.client.post(url, body)
    return unwrapApi<T>(res)
  }

  async patch<T>(url: string, body?: unknown): Promise<T> {
    const res = await this.client.patch(url, body)
    return unwrapApi<T>(res)
  }

  async delete<T>(url: string): Promise<T> {
    const res = await this.client.delete(url)
    return unwrapApi<T>(res)
  }

  async request<T>(method: 'POST' | 'PATCH' | 'DELETE', url: string, body?: unknown): Promise<T> {
    if (method === 'POST') return this.post<T>(url, body)
    if (method === 'PATCH') return this.patch<T>(url, body)
    return this.delete<T>(url)
  }
}

export const apiClient = new ApiClient()
