import { SITE_DESCRIPTION, SITE_TAGLINE } from '../modules/marketing/constants/siteContent'

export const SITE_LOCALE = 'fr_FR'
export const DEFAULT_OG_IMAGE = '/images/facturio-hero.png'
export const DEFAULT_KEYWORDS =
  'facturation, devis, factures, freelance développeur, agence web, TVA, comptabilité, Stripe, Factur-X'

/**
 * Nom de marque pour titres et Open Graph.
 * - `VITE_APP_NAME` : forcé au build (par domaine / déploiement)
 * - Sinon : premier segment du hostname (ex. devis.mondomaine.fr → Devis)
 * - localhost : chaîne vide → titre de page seul, sans suffixe
 */
export function getSiteBrandName(): string {
  const env = import.meta.env.VITE_APP_NAME
  if (env !== undefined && env !== null) {
    return String(env).trim()
  }

  if (typeof window === 'undefined') return ''

  const host = window.location.hostname
  if (!host || host === 'localhost' || host === '127.0.0.1') return ''

  const segment = host.split('.')[0]
  if (!segment || segment === 'www') return ''

  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

/** @deprecated Préférer getSiteBrandName() — conservé pour compatibilité imports. */
export function getAppName(): string {
  return getSiteBrandName()
}

/** URL canonique du site (sans slash final). */
export function getSiteOrigin(): string {
  const fromEnv =
    import.meta.env.VITE_SITE_URL?.trim() ||
    import.meta.env.VITE_PUBLIC_APP_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (typeof window !== 'undefined') return window.location.origin
  return ''
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin()
  if (!origin) {
    const p = path.startsWith('/') ? path : `/${path}`
    return p
  }
  const p = path.startsWith('/') ? path : `/${path}`
  return `${origin}${p}`
}

export const DEFAULT_SEO = {
  title: 'Accueil',
  description: SITE_DESCRIPTION,
  tagline: SITE_TAGLINE,
} as const
