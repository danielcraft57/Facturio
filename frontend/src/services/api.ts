import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

// Types pour les réponses API
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  code?: string
  details?: any
}

// Configuration par défaut
// En dev, utiliser le proxy Vite (/api) pour éviter les problèmes CORS
// En prod, utiliser VITE_API_URL ou l'URL complète
const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development'
const API_BASE_URL = isDev 
  ? '/api'  // Proxy Vite vers le backend local
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api')

// Classe pour gérer les erreurs API
export class ApiError extends Error {
  status: number
  code?: string
  details?: any

  constructor(status: number, code?: string, details?: any) {
    super(`Erreur API ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

// Client HTTP avec intercepteurs
type RetryableAxiosConfig = AxiosRequestConfig & { __retryCount?: number }

class ApiClient {
  public client: AxiosInstance
  private maxRetries = 3

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Intercepteur de requête
    this.client.interceptors.request.use(
      (config: any) => {
        // Ajouter le token d'auth si disponible
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Ajouter un timestamp pour éviter le cache
        config.params = {
          ...config.params,
          _t: Date.now(),
        }

        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error: any) => {
        console.error('❌ Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Intercepteur de réponse
    this.client.interceptors.response.use(
      (response: AxiosResponse<any>) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`)
        
        // NestJS retourne directement les données, pas dans un wrapper { data: ... }
        // On normalise la réponse pour avoir toujours le format { data: ..., success: true }
        if (response.data && typeof response.data === 'object') {
          // Si c'est déjà un format ApiResponse, on le garde tel quel
          if ('data' in response.data && 'success' in response.data) {
            return response
          }
          // Sinon, on wrap la réponse dans le format attendu
          return {
            ...response,
            data: {
              success: true,
              data: response.data
            }
          }
        }
        
        return {
          ...response,
          data: {
            success: true,
            data: response.data
          }
        }
      },
      async (error: any) => {
        const { response, config } = error
        const retryConfig = config as RetryableAxiosConfig | undefined
        const status = response?.status ?? 0
        const retryCount = retryConfig?.__retryCount ?? 0
        const isRetryable = status >= 500 || status === 0

        if (retryConfig && isRetryable && retryCount < this.maxRetries) {
          retryConfig.__retryCount = retryCount + 1
          if (retryCount === 0) {
            console.warn(
              `⚠️ API indisponible (${status || 'réseau'}) — nouvelle tentative (${retryConfig.url})`,
            )
          }
          await new Promise((resolve) =>
            setTimeout(resolve, 400 * Math.pow(2, retryCount)),
          )
          return this.client.request(retryConfig)
        }

        console.error('❌ API Error:', {
          status: response?.status,
          url: config?.url,
          message: response?.data?.message || error.message,
        })

        // Gestion des erreurs spécifiques
        if (response?.status === 401) {
          const path = (config?.url || '').split('?')[0]
          const isAuthBootstrap = path.includes('/auth/session/bootstrap')
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          // Évite une boucle login → /auth/session → bootstrap 401 → login
          if (!isAuthBootstrap && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login'
          }
        }

        // Créer une erreur API standardisée
        const apiError = new ApiError(
          response?.status || 0,
          response?.data?.code,
          response?.data?.details
        )
        apiError.message = response?.data?.message || error.message

        return Promise.reject(apiError)
      }
    )
  }

  // Méthodes HTTP génériques
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.get(url, config)
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.post(url, data, config)
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.put(url, data, config)
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.patch(url, data, config)
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.client.delete(url, config)
  }

  // Méthodes spécialisées
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  }

  // Cache simple en mémoire
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  async getCached<T = any>(url: string, ttl = 5 * 60 * 1000): Promise<ApiResponse<T>> {
    const cacheKey = `${this.client.defaults.baseURL}${url}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`💾 Cache hit: ${url}`)
      return cached.data
    }

    const response = await this.get<T>(url)
    
    this.cache.set(cacheKey, {
      data: response,
      timestamp: Date.now(),
      ttl,
    })

    return response
  }

  // Invalider le cache
  invalidateCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
    console.log('🗑️ Cache invalidated')
  }
}

// Instance singleton
export const apiClient = new ApiClient()

// Export des types pour utilisation externe
export type { AxiosRequestConfig, AxiosResponse }
