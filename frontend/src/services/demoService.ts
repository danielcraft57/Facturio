import { apiClient } from './api'
import { getDeviceFingerprint } from '../utils/deviceFingerprint'
import { resetDemoExploreState } from '../utils/demoExploreStorage'
import { resetDemoAnalyticsSession } from '../utils/demoAnalytics'
import type { AuthResponse, User } from './authService'

const DEMO_USER_EMAIL = 'demo@facturio.local'
const DEMO_ORG_NAME = 'Facturio Démo'

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
      resetDemoExploreState()
      resetDemoAnalyticsSession()
      try {
        sessionStorage.removeItem('facturio_demo_efacture_hint_seen')
      } catch {
        /* ignore */
      }
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

  /**
   * Aligne le flag session démo avec le profil utilisateur (après refresh / bootstrap).
   *
   * @param user - Utilisateur courant ou null
   */
  syncDemoSessionFlag(user: User | null | undefined): void {
    if (!user) {
      this.clearDemoFlag()
      return
    }
    const email = user.email?.trim().toLowerCase()
    const orgName = user.organization?.name?.trim()
    const isDemoUser = email === DEMO_USER_EMAIL || orgName === DEMO_ORG_NAME
    if (isDemoUser) {
      localStorage.setItem('demo_mode', '1')
      return
    }
    this.clearDemoFlag()
  }
}

export const demoService = new DemoService()
