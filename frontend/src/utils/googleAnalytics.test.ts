import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const CONSENT_KEY = 'facturio_cookie_consent_v1'

function fireGtagScriptLoad(): void {
  const script = document.querySelector(
    'script[src*="googletagmanager"]',
  ) as HTMLScriptElement | null
  script?.onload?.(new Event('load') as Event)
}

describe('googleAnalytics', () => {
  beforeEach(() => {
    vi.resetModules()
    document.head.innerHTML = ''
    localStorage.clear()
    delete (window as { dataLayer?: unknown[] }).dataLayer
    delete (window as { gtag?: (...args: unknown[]) => void }).gtag
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('n’initialise pas gtag si GA désactivé', async () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_GA_ENABLED', '')

    const { initGoogleAnalytics } = await import('./googleAnalytics')
    initGoogleAnalytics()

    expect(window.gtag).toBeUndefined()
  })

  it('envoie page_view après chargement script et consentement', async () => {
    vi.stubEnv('PROD', true)
    localStorage.setItem(CONSENT_KEY, new Date().toISOString())

    const { initGoogleAnalytics, trackGoogleAnalyticsPageView } = await import('./googleAnalytics')

    initGoogleAnalytics()
    fireGtagScriptLoad()
    trackGoogleAnalyticsPageView('/')

    const pageView = window.dataLayer?.find(
      (entry) => entry[0] === 'event' && entry[1] === 'page_view',
    )
    expect(pageView).toBeTruthy()
    expect(pageView?.[2]).toMatchObject({ page_path: '/' })
  })

  it('bypass consentement en dev avec VITE_GA_ENABLED', async () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_GA_ENABLED', 'true')

    const { initGoogleAnalytics, trackGoogleAnalyticsPageView } = await import('./googleAnalytics')

    initGoogleAnalytics()
    fireGtagScriptLoad()
    trackGoogleAnalyticsPageView('/tarifs')

    const pageView = window.dataLayer?.find(
      (entry) => entry[0] === 'event' && entry[1] === 'page_view',
    )
    expect(pageView).toBeTruthy()
    expect(pageView?.[2]).toMatchObject({ page_path: '/tarifs' })
  })
})
