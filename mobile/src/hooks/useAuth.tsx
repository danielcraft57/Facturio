import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '../services/authService'
import { apiClient } from '../services/apiClient'
import { isDeviceVerification, type LoginResult, type User } from '../types/auth'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => Promise<void>
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
  }, [])

  useEffect(() => {
    apiClient.setUnauthorizedHandler(() => {
      setUser(null)
    })

    authService.restoreSession().then((restored) => {
      setUser(restored)
      setIsLoading(false)
    })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      const result = await authService.login(email, password)
      if (!isDeviceVerification(result)) {
        setUser(result.user)
      }
      return result
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Connexion impossible'
      setError(message)
      throw e
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      error,
      clearError: () => setError(null),
    }),
    [user, isLoading, login, logout, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
