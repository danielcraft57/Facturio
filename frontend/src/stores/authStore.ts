import { create } from 'zustand'
import {
  authService,
  type User,
  type LoginDto,
  type SignupDto,
  type DeviceVerificationResponse,
} from '../services/authService'
import { getDeviceFingerprint } from '../utils/deviceFingerprint'

/**
 * État du store d'authentification
 */
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

/**
 * Actions du store d'authentification
 */
interface AuthActions {
  login: (credentials: LoginDto) => Promise<void | DeviceVerificationResponse>
  bootstrapSession: () => Promise<void | DeviceVerificationResponse>
  signup: (data: SignupDto) => Promise<void | { needVerification: true; message?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  setUser: (user: User | null) => void
}

type AuthStore = AuthState & AuthActions

/**
 * Store Zustand pour l'authentification
 * 
 * Gère l'état de l'utilisateur connecté et les opérations d'authentification.
 * Persiste l'utilisateur dans le localStorage.
 */
export const useAuthStore = create<AuthStore>((set, get) => ({
  // État initial
  user: authService.getStoredUser(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false,
  error: null,

  /**
   * Connexion d'un utilisateur
   */
  login: async (credentials: LoginDto) => {
    set({ isLoading: true, error: null })
    try {
      const fingerprint = await getDeviceFingerprint()
      const response = await authService.login({ ...credentials, deviceFingerprint: fingerprint })
      if ((response as DeviceVerificationResponse).needDeviceVerification) {
        set({ isLoading: false, error: null, user: null, isAuthenticated: false })
        return response as DeviceVerificationResponse
      }
      const auth = response as { user: User }
      set({
        user: auth.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Erreur lors de la connexion',
      })
      throw error
    }
  },

  /**
   * Inscription d'un nouvel utilisateur.
   * Si le serveur renvoie needVerification (validation email), ne connecte pas l'utilisateur.
   */
  signup: async (data: SignupDto) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.signup(data)
      if ((response as any).needVerification) {
        set({ isLoading: false, error: null })
        return response as any
      }
      set({
        user: (response as any).user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Erreur lors de l\'inscription',
      })
      throw error
    }
  },

  /**
   * Déconnexion : nettoie le store, le localStorage/sessionStorage et le cookie côté serveur, puis redirige vers /login
   */
  logout: async () => {
    set({ isLoading: true })
    try {
      await authService.logout()
    } catch (_) {}
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  },

  /**
   * Vérifie l'authentification actuelle
   * 
   * Récupère le profil utilisateur depuis le serveur pour valider le token.
   */
  bootstrapSession: async () => {
    set({ isLoading: true, error: null })
    try {
      const fingerprint = await getDeviceFingerprint()
      const response = await authService.bootstrapSession(fingerprint)
      if ((response as DeviceVerificationResponse).needDeviceVerification) {
        set({ isLoading: false, user: null, isAuthenticated: false })
        return response as DeviceVerificationResponse
      }
      const auth = response as { user: User }
      set({
        user: auth.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Session invalide',
      })
      throw error
    }
  },

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      const user = await authService.getCurrentUser()
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },

  /**
   * Efface l'erreur actuelle
   */
  clearError: () => {
    set({ error: null })
  },

  /**
   * Définit manuellement l'utilisateur
   */
  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
    })
  },
}))

