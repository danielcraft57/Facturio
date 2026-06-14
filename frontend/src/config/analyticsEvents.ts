import { trackGoogleAnalyticsEvent } from '../utils/googleAnalytics'

/**
 * Noms d'événements GA4 (snake_case, stables pour les rapports et entonnoirs).
 * @see docs/marketing/ROADMAP_MARKETING_2026.md
 */
export const GA_EVENTS = {
  CTA_SIGNUP: 'cta_signup',
  CTA_SIGNUP_HERO: 'cta_signup_hero',
  CTA_BETA: 'cta_beta',
  CTA_BETA_CODE: 'cta_beta_code',
  CTA_EFACTURE: 'cta_efacture',
  CTA_PRICING: 'cta_pricing',
  CTA_PRESTATIONS: 'cta_prestations',
  SCROLL_DEPTH: 'scroll_depth',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
} as const

export type GaEventName = (typeof GA_EVENTS)[keyof typeof GA_EVENTS]

/** Paramètres optionnels envoyés avec un événement GA4. */
export type GoogleAnalyticsEventParams = Record<string, string | number | boolean | undefined>

/**
 * Enregistre un clic CTA marketing (bouton ou lien vers inscription, tarifs, etc.).
 *
 * @param options.event - Nom d'événement GA4
 * @param options.label - Libellé visible du bouton
 * @param options.destination - Chemin ou URL cible
 * @param options.section - Zone de la page (hero, pricing, beta_banner…)
 */
export function trackMarketingCtaClick(options: {
  event: string
  label: string
  destination: string
  section?: string
}): void {
  trackGoogleAnalyticsEvent(options.event, {
    link_text: options.label,
    link_url: options.destination,
    section: options.section,
  })
}

/**
 * Profondeur de scroll atteinte (une fois par seuil et par page).
 *
 * @param percent - Pourcentage de scroll (ex. 50)
 * @param pagePath - Chemin de la page
 */
export function trackScrollDepth(percent: number, pagePath: string): void {
  trackGoogleAnalyticsEvent(GA_EVENTS.SCROLL_DEPTH, {
    percent,
    page_path: pagePath,
  })
}
