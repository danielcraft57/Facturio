import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('resolveApiBaseUrl', () => {
  beforeEach(() => {
    vi.stubEnv('MODE', 'production')
    vi.stubEnv('DEV', false)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('retourne /api si VITE_API_URL contient le placeholder your_domain', async () => {
    vi.stubEnv('VITE_API_URL', 'https://facturio.your_domain/api')
    const { resolveApiBaseUrl } = await import('./resolveApiBaseUrl')
    expect(resolveApiBaseUrl()).toBe('/api')
  })

  it('conserve une URL explicite valide', async () => {
    vi.stubEnv('VITE_API_URL', 'https://facturio.danielcraft.fr/api')
    const { resolveApiBaseUrl } = await import('./resolveApiBaseUrl')
    expect(resolveApiBaseUrl()).toBe('https://facturio.danielcraft.fr/api')
  })

  it('retourne /api en dev', async () => {
    vi.stubEnv('MODE', 'development')
    vi.stubEnv('DEV', true)
    vi.stubEnv('VITE_API_URL', 'https://facturio.your_domain/api')
    const { resolveApiBaseUrl } = await import('./resolveApiBaseUrl')
    expect(resolveApiBaseUrl()).toBe('/api')
  })
})
