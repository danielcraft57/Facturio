import { GA_MEASUREMENT_ID, isGoogleAnalyticsEnabled } from '../config/analytics'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let initialized = false

export function initGoogleAnalytics(): void {
  if (!isGoogleAnalyticsEnabled() || initialized || typeof window === 'undefined') return
  initialized = true

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)
}

export function trackGoogleAnalyticsPageView(pagePath: string): void {
  if (!isGoogleAnalyticsEnabled() || !window.gtag) return
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: pagePath })
}

/**
 * Envoie un événement personnalisé à GA4 (clics CTA, signup, scroll, etc.).
 *
 * @param eventName - Nom stable de l'événement (snake_case)
 * @param params - Paramètres optionnels (link_text, section, plan…)
 */
export function trackGoogleAnalyticsEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  if (!isGoogleAnalyticsEnabled() || !window.gtag) return
  const cleaned = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
      )
    : undefined
  window.gtag('event', eventName, cleaned)
}
