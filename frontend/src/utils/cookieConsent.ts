export const COOKIE_CONSENT_STORAGE_KEY = 'facturio_cookie_consent_v1'
export const ANALYTICS_CONSENT_EVENT = 'facturio:analytics-consent'
export const GA_READY_EVENT = 'facturio:ga-ready'

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return !!localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
  } catch {
    return false
  }
}

export function grantAnalyticsConsent(): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, new Date().toISOString())
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(ANALYTICS_CONSENT_EVENT))
}
