import { apiClient } from './api'
import { getDeviceFingerprint } from '../utils/deviceFingerprint'
import type { AuthResponse } from './authService'

/** Statistiques de l'espace démo. */
export interface DemoCounts {
  clients: number
  invoices: number
  quotes: number
  products: number
}

/** Informations publiques sur la démo. */
export interface DemoInfo {
  available: boolean
  organizationName: string
  organizationId: number | null
  counts: DemoCounts
  enterPath: string
  message: string
}

/** Réponse de connexion démo. */
export interface DemoEnterResponse extends AuthResponse {
  isDemo: true
  message: string
}

/**
 * Service API pour l'espace démo partagé.
 */
class DemoService {
  private readonly baseUrl = '/demo'

  private unwrap<T>(response: { data: unknown }): T {
    if (response?.data && typeof response.data === 'object' && 'data' in response.data) {
      return (response.data as { data: T }).data
    }
    return response.data as T
  }

  /**
   * Récupère l'état de la démo (disponible, volumes de données).
   */
  async getInfo(): Promise<DemoInfo> {
    const response = await apiClient.get<DemoInfo>(`${this.baseUrl}/info`)
    return this.unwrap<DemoInfo>(response)
  }

  /**
   * Connexion instantanée sur le compte démo partagé.
   */
  async enter(): Promise<DemoEnterResponse> {
    const deviceFingerprint = await getDeviceFingerprint()
    const response = await apiClient.post<DemoEnterResponse>(`${this.baseUrl}/enter`, {
      deviceFingerprint,
    })
    const payload = this.unwrap<DemoEnterResponse>(response)

    if (payload?.access_token) {
      localStorage.setItem('auth_token', payload.access_token)
      localStorage.setItem('user', JSON.stringify(payload.user))
      localStorage.setItem('demo_mode', '1')
      return payload
    }

    throw new Error('Réponse invalide du serveur')
  }

  /** Indique si la session courante provient de la démo. */
  isDemoSession(): boolean {
    return localStorage.getItem('demo_mode') === '1'
  }

  /** Efface l'indicateur démo (logout). */
  clearDemoFlag(): void {
    localStorage.removeItem('demo_mode')
  }
}

export const demoService = new DemoService()
