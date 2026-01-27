import { apiClient } from './api'

/**
 * Types pour l'authentification
 */
export interface LoginDto {
  email: string
  password: string
}

export interface SignupDto {
  email: string
  password: string
  firstName?: string
  lastName?: string
  organizationName: string
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
  async login(credentials: LoginDto): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        `${this.baseUrl}/login`,
        credentials
      )
      const payload = this.unwrap<AuthResponse>(response)

      if (payload && payload.access_token) {
        // Stocker le token dans localStorage (le cookie est géré côté serveur)
        localStorage.setItem('auth_token', payload.access_token)
        localStorage.setItem('user', JSON.stringify(payload.user))
        return payload
      }

      throw new Error('Réponse invalide du serveur')
    } catch (error: any) {
      const message = error.message || 'Erreur lors de la connexion'
      throw new Error(message)
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   * 
   * @param data - Données d'inscription
   * @returns Token JWT et informations utilisateur
   * @throws {Error} Si l'email existe déjà ou si les données sont invalides
   */
  async signup(data: SignupDto): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        `${this.baseUrl}/signup`,
        data
      )
      const payload = this.unwrap<AuthResponse>(response)

      if (payload && payload.access_token) {
        // Stocker le token dans localStorage
        localStorage.setItem('auth_token', payload.access_token)
        localStorage.setItem('user', JSON.stringify(payload.user))
        return payload
      }

      throw new Error('Réponse invalide du serveur')
    } catch (error: any) {
      const message = error.message || 'Erreur lors de l\'inscription'
      throw new Error(message)
    }
  }

  /**
   * Déconnexion d'un utilisateur
   * 
   * Supprime le token et les données utilisateur du localStorage
   * et appelle l'endpoint de déconnexion du serveur.
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/logout`)
    } catch (error) {
      // Même en cas d'erreur, on nettoie le localStorage
      console.error('Erreur lors de la déconnexion:', error)
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
  }

  /**
   * Récupère le profil de l'utilisateur actuel
   * 
   * @returns Informations utilisateur
   * @throws {Error} Si l'utilisateur n'est pas authentifié
   */
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
    const token = localStorage.getItem('auth_token')
    return !!token
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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
    window.location.href = `${apiUrl}/auth/google`
  }
}

export const authService = new AuthService()

