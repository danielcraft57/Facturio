/** ID de mesure GA4. Surcharge : VITE_GA_MEASUREMENT_ID */
export const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || 'G-NHKWSD172Z'

/** DebugView uniquement si VITE_GA_DEBUG=true (sinon → Temps réel). */
export function isGoogleAnalyticsDebugMode(): boolean {
  return import.meta.env.VITE_GA_DEBUG === 'true'
}

/** Actif en prod, ou en dev si VITE_GA_ENABLED=true. */
export function isGoogleAnalyticsEnabled(): boolean {
  if (!GA_MEASUREMENT_ID) return false
  if (import.meta.env.PROD) return true
  return import.meta.env.VITE_GA_ENABLED === 'true'
}

/** Dev local : pas de clic bannière requis pour tester. */
export function isGoogleAnalyticsDevBypassConsent(): boolean {
  return !import.meta.env.PROD && import.meta.env.VITE_GA_ENABLED === 'true'
}

export function getGoogleAnalyticsConfigOptions(): Record<string, unknown> {
  return {
    send_page_view: false,
    allow_google_signals: true,
    allow_ad_personalization_signals: true,
    cookie_domain: 'auto',
    cookie_flags: import.meta.env.PROD ? 'SameSite=Lax;Secure' : 'SameSite=Lax',
    cookie_update: true,
    ...(isGoogleAnalyticsDebugMode() ? { debug_mode: true } : {}),
  }
}
