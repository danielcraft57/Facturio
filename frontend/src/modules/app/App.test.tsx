import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { App } from './App'

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector?: (s: Record<string, unknown>) => unknown) => {
    const state = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn().mockResolvedValue(undefined),
      clearError: vi.fn(),
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('../../services/api', () => ({
  apiClient: {
    getCached: vi.fn(async () => ({
      success: true,
      data: {},
    })),
  },
}))

describe('App (frontend)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('se monte sans erreur avec le router et le theme', () => {
    expect(() => render(<App />)).not.toThrow()
    expect(document.body.firstChild).toBeTruthy()
  })

})
