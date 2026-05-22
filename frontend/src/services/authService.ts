import { apiClient } from './api'
import { resolveApiBaseUrl } from '../utils/resolveApiBaseUrl'

/**
 * Types pour l'authentification
 */
export interface LoginDto {
  email: string
  password: string
  deviceFingerprint?: string
}

export interface DeviceVerificationResponse {
  needDeviceVerification: true
  message: string
  email?: string
}

export interface SignupDto {
  email: string
  password: string
  firstName?: string
  lastName?: string
  organizationName: string
  acceptTerms: boolean
  acceptPrivacy: boolean
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: string
  organization?: {
    id: string
    name: string
  }
}

export interface AuthResponse {
  access_token: string
  user: User
}

/** Réponse signup quand vérification email requise (pas de token). */
export interface SignupNeedVerificationResponse {
  message: string
  needVerification: true
}

/**
 * Service d'authentification
 * 
 * Gère toutes les opérations liées à l'authentification :
 * - Connexion (login)
 * - Inscription (signup)
 * - Déconnexion (logout)
 * - Récupération du profil utilisateur
 * - Authentification Google OAuth
 */
class AuthService {
  private readonly baseUrl = '/auth'

  /**
   * Extrait la charge utile d'une réponse normalisée par apiClient.
   * apiClient wrappe les réponses Nest en { success: true, data }.
   */
  private unwrap<T>(response: { data: any }): T {
    if (response && response.data) {
      // Si la réponse est déjà de la forme { success, data }
      if (typeof response.data === 'object' && 'data' in response.data) {
        return response.data.data as T
      }
      return response.data as T
    }
    throw new Error('Réponse invalide du serveur')
  }

  /**
   * Connexion d'un utilisateur
   * 
   * @param credentials - Email et mot de passe
   * @returns Token JWT et informations utilisateur
   * @throws {Error} Si les identifiants sont incorrects
   */
  async login(credentials: LoginDto): Promise<AuthResponse | DeviceVerificationResponse> {
    try {
      const response = await apiClient.post<AuthResponse | DeviceVerificationResponse>(
        `${this.baseUrl}/login`,
        credentials
      )
      const payload = this.unwrap<AuthResponse | DeviceVerificationResponse>(response)

      if (payload && (payload as DeviceVerificationResponse).needDeviceVerification) {
        return payload as DeviceVerificationResponse
      }

      const auth = payload as AuthResponse
      if (auth?.access_token) {
        localStorage.setItem('auth_token', auth.access_token)
        localStorage.setItem('user', JSON.stringify(auth.user))
        return auth
      }

      throw new Error('Réponse invalide du serveur')
    } catch (error: any) {
      const message = error.message || 'Erreur lors de la connexion'
      throw new Error(message)
    }
  }

  /**
   * Inscription d'un nouvel utilisateur.
   * Si le serveur renvoie needVerification, aucun token n'est stocké : l'utilisateur doit cliquer sur le lien reçu par email.
   *
   * @param data - Données d'inscription
   * @returns AuthResponse (connecté) ou SignupNeedVerificationResponse (email de confirmation envoyé)
   */
  async signup(data: SignupDto): Promise<AuthResponse | SignupNeedVerificationResponse> {
    try {
      const response = await apiClient.post<AuthResponse | SignupNeedVerificationResponse>(
        `${this.baseUrl}/signup`,
        data
      )
      const payload = this.unwrap<AuthResponse | SignupNeedVerificationResponse>(response)

      if (payload && (payload as SignupNeedVerificationResponse).needVerification) {
        return payload as SignupNeedVerificationResponse
      }

      const auth = payload as AuthResponse
      if (auth?.access_token) {
        localStorage.setItem('auth_token', auth.access_token)
        localStorage.setItem('user', JSON.stringify(auth.user))
        return auth
      }

      throw new Error('Réponse invalide du serveur')
    } catch (error: any) {
      const message = error.message || 'Erreur lors de l\'inscription'
      throw new Error(message)
    }
  }

  /**
   * Vérifie l'adresse email avec le token reçu par email (lien d'inscription).
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const res = await apiClient.get<{ message: string }>(`${this.baseUrl}/verify-email`, {
      params: { token },
    })
    return (res as any).data?.data ?? (res as any).data ?? res
  }

  /**
   * Renvoie l'email de vérification pour un compte non encore activé.
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(`${this.baseUrl}/resend-verification`, { email })
    return (res as any).data?.data ?? (res as any).data ?? res
  }

  /**
   * Déconnexion d'un utilisateur
   * Supprime token, user, et tous les stockages liés à l'auth, appelle le backend pour supprimer le cookie.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/logout`)
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('auth_token')
      sessionStorage.removeItem('user')
    }
  }

  /**
   * Demande d'envoi d'un email de réinitialisation du mot de passe
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(`${this.baseUrl}/forgot-password`, { email })
    return (res as any).data?.data ?? (res as any).data ?? res
  }

  /**
   * Réinitialise le mot de passe avec le token reçu par email
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(`${this.baseUrl}/reset-password`, { token, newPassword })
    return (res as any).data?.data ?? (res as any).data ?? res
  }

  /**
   * Récupère le profil de l'utilisateur actuel
   * 
   * @returns Informations utilisateur
   * @throws {Error} Si l'utilisateur n'est pas authentifié
   */
  async bootstrapSession(deviceFingerprint: string): Promise<AuthResponse | DeviceVerificationResponse> {
    const response = await apiClient.post<AuthResponse | DeviceVerificationResponse>(
      `${this.baseUrl}/session/bootstrap`,
      { deviceFingerprint },
    )
    const payload = this.unwrap<AuthResponse | DeviceVerificationResponse>(response)
    if ((payload as DeviceVerificationResponse).needDeviceVerification) {
      return payload as DeviceVerificationResponse
    }
    const auth = payload as AuthResponse
    if (auth?.access_token) {
      localStorage.setItem('auth_token', auth.access_token)
      localStorage.setItem('user', JSON.stringify(auth.user))
    }
    return auth
  }

  async verifyDevice(token: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${this.baseUrl}/verify-device`, { token })
    const payload = this.unwrap<AuthResponse>(response)
    if (payload?.access_token) {
      localStorage.setItem('auth_token', payload.access_token)
      localStorage.setItem('user', JSON.stringify(payload.user))
    }
    return payload
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>(`${this.baseUrl}/me`)
      const user = this.unwrap<User>(response)

      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
        return user
      }

      throw new Error('Réponse invalide du serveur')
    } catch (error: any) {
      // Si erreur 401, nettoyer le localStorage
      if (error.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      }
      throw error
    }
  }

  /**
   * Vérifie si un utilisateur est authentifié
   * 
   * @returns true si un token est présent
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token')
  }

  /** Efface la session locale (token + profil). */
  clearLocalSession(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
  }

  /**
   * Récupère l'utilisateur depuis le localStorage
   * 
   * @returns Utilisateur ou null
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user')
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  /**
   * Démarre l'authentification Google OAuth
   * 
   * Redirige vers l'endpoint Google du backend
   */
  loginWithGoogle(): void {
    const apiUrl = resolveApiBaseUrl()
    window.location.href = `${apiUrl}/auth/google`
  }
}

export const authService = new AuthService()

