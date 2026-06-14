import { afterEach, describe, expect, it } from 'vitest'
import { consumeOAuthAccessTokenFromHash } from './oauthHashToken'

describe('consumeOAuthAccessTokenFromHash', () => {
  afterEach(() => {
    localStorage.clear()
    window.history.replaceState(null, '', '/auth/session?from=/installation')
  })

  it('extrait le token du hash et nettoie l’URL', () => {
    window.history.replaceState(null, '', '/auth/session?from=/installation#access_token=abc123')

    expect(consumeOAuthAccessTokenFromHash()).toBe('abc123')
    expect(localStorage.getItem('auth_token')).toBe('abc123')
    expect(window.location.hash).toBe('')
  })

  it('retourne null sans hash', () => {
    expect(consumeOAuthAccessTokenFromHash()).toBeNull()
  })
})
