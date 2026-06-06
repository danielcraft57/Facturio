import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('googleAnalytics', () => {
  beforeEach(() => {
    vi.resetModules()
    document.head.innerHTML = ''
    delete (window as { dataLayer?: unknown[] }).dataLayer
    delete (window as { gtag?: (...args: unknown[]) => void }).gtag
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('n’initialise pas gtag en environnement de test', async () => {
    vi.stubEnv('PROD', false)
    vi.stubEnv('VITE_GA_ENABLED', '')

    const { initGoogleAnalytics, trackGoogleAnalyticsPageView } = await import('./googleAnalytics')

    initGoogleAnalytics()
    trackGoogleAnalyticsPageView('/factures/inbox')

    expect(window.gtag).toBeUndefined()
    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull()
  })

  it('initialise gtag et envoie les pages vues en production', async () => {
    vi.stubEnv('PROD', true)

    const { initGoogleAnalytics, trackGoogleAnalyticsPageView } = await import('./googleAnalytics')

    initGoogleAnalytics()
    trackGoogleAnalyticsPageView('/creances')

    expect(window.gtag).toBeTypeOf('function')
    expect(document.querySelector('script[src*="G-TVDKVFYP25"]')).not.toBeNull()
    expect(window.dataLayer).toEqual(
      expect.arrayContaining([
        ['js', expect.any(Date)],
        ['config', 'G-TVDKVFYP25', { send_page_view: false }],
        ['config', 'G-TVDKVFYP25', { page_path: '/creances' }],
      ]),
    )
  })
})
