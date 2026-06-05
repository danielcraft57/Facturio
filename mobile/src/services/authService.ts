import { apiClient } from './apiClient'
import {
  getDeviceFingerprint,
  setAuthSession,
  clearAuthSession,
  getStoredUserJson,
  getAuthToken,
} from './sessionStorage'
import type {
  AuthResponse,
  DeviceVerificationResponse,
  LoginDto,
  LoginResult,
  User,
} from '../types/auth'

const baseUrl = '/auth'

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const deviceFingerprint = await getDeviceFingerprint()
    const payload: LoginDto = { email: email.trim().toLowerCase(), password, deviceFingerprint }
    const result = await apiClient.post<LoginResult>(`${baseUrl}/login`, payload)

    if ('needDeviceVerification' in result && result.needDeviceVerification) {
      return result as DeviceVerificationResponse
    }

    const auth = result as AuthResponse
    await setAuthSession(auth.access_token, JSON.stringify(auth.user))
    return auth
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(`${baseUrl}/logout`)
    } catch {
      // ignore network errors on logout
    } finally {
      await clearAuthSession()
    }
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>(`${baseUrl}/me`)
  },

  async restoreSession(): Promise<User | null> {
    const token = await getAuthToken()
    const userJson = await getStoredUserJson()
    if (!token || !userJson) return null
    try {
      const user = await this.getCurrentUser()
      await setAuthSession(token, JSON.stringify(user))
      return user
    } catch {
      await clearAuthSession()
      return null
    }
  },

  async getStoredUser(): Promise<User | null> {
    const userJson = await getStoredUserJson()
    if (!userJson) return null
    try {
      return JSON.parse(userJson) as User
    } catch {
      return null
    }
  },
}
