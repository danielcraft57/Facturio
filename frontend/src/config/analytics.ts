/** ID de mesure Google Analytics 4 (gtag). Surcharge possible via VITE_GA_MEASUREMENT_ID. */
export const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || 'G-TVDKVFYP25'

/** Actif en build production, ou en dev si VITE_GA_ENABLED=true. */
export function isGoogleAnalyticsEnabled(): boolean {
  if (!GA_MEASUREMENT_ID) return false
  if (import.meta.env.PROD) return true
  return import.meta.env.VITE_GA_ENABLED === 'true'
}
