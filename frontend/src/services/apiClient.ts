import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse } from '../types/api';
import { resolveApiBaseUrl } from '../utils/resolveApiBaseUrl';

class ApiClient {
  private static instance: ApiClient;
  private axiosInstance: AxiosInstance;
  private cache = new Map<string, { data: ApiResponse<unknown>; timestamp: number; ttl: number }>();

  private constructor() {
    const baseURL = resolveApiBaseUrl();

    this.axiosInstance = axios.create({
      baseURL,
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /** Réinitialise le singleton (tests uniquement). */
  static resetInstanceForTests(): void {
    ApiClient.instance = undefined as unknown as ApiClient;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Ajouter le token d'authentification si disponible
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        // Gestion globale des erreurs
        if (error.response?.status === 401) {
          // Token expiré, rediriger vers login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private cacheKey(url: string): string {
    return `${this.axiosInstance.defaults.baseURL ?? ''}${url}`;
  }

  peekCached<T>(url: string): ApiResponse<T> | null {
    const cached = this.cache.get(this.cacheKey(url));
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as ApiResponse<T>;
    }
    return null;
  }

  async getCached<T>(url: string, ttl = 2 * 60 * 1000): Promise<ApiResponse<T>> {
    const key = this.cacheKey(url);
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as ApiResponse<T>;
    }

    const response = await this.get<T>(url);
    this.cache.set(key, { data: response, timestamp: Date.now(), ttl });
    return response;
  }

  invalidateCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) this.cache.delete(key);
      }
      return;
    }
    this.cache.clear();
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur réseau'
      };
    }
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const raw = err.response?.data?.message;
      const message =
        typeof raw === 'string'
          ? raw
          : Array.isArray(raw)
            ? raw.join(', ')
            : err.message || 'Erreur réseau';
      return {
        success: false,
        error: message,
      };
    }
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur réseau'
      };
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur réseau'
      };
    }
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erreur réseau'
      };
    }
  }
}

export { ApiClient };
