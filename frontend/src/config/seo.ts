import { SITE_TAGLINE } from '../modules/marketing/constants/siteContent'

export const SITE_LOCALE = 'fr_FR'
export const SEO_BRAND_NAME = 'PrestaFacture'

/** Dimensions recommandées OG / Twitter (ratio 1.91:1, Facebook, LinkedIn, Slack). */
export const OG_IMAGE_WIDTH = 1200
export const OG_IMAGE_HEIGHT = 630
export const OG_IMAGE_TYPE = 'image/jpeg'

export const DEFAULT_OG_IMAGE = '/images/facturio-hero.jpg'

/** Texte alt par défaut pour l'image OG accueil. */
export const DEFAULT_OG_IMAGE_ALT =
  'Illustration PrestaFacture : freelance avec ordinateur, facture validée et pièces en euros sur fond teal.'

/** Mots-clés communs — pages marketing complètent avec des termes ciblés. */
export const DEFAULT_KEYWORDS =
  'logiciel devis factures, facturation freelance, studio digital, communication marketing, devis en ligne, facture électronique 2026, PrestaFacture'

/** Description meta accueil (~155 car.) — réutilisée sur / et index.html. */
export const SEO_HOME_DESCRIPTION =
  'Devis et factures en ligne pour freelances, studios et petites équipes. Web, communication, marketing : catalogue, Stripe, TVA et réforme 2026. Essai gratuit.'

/** Titres et descriptions par page publique (suffixe marque ajouté par applySeo). */
export const MARKETING_SEO = {
  home: {
    title: 'Logiciel de devis et factures pour freelances et studios',
    description: SEO_HOME_DESCRIPTION,
    keywords:
      `${DEFAULT_KEYWORDS}, logiciel facturation indépendant, devis factures en ligne, réforme facturation 2026`,
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
  },
  prestations: {
    title: 'Facturation web, communication et marketing',
    description:
      'Forfaits site, campagne réseaux sociaux, identité visuelle et maintenance client. Catalogue de prestations prêt à l\'emploi pour chiffrer et facturer plus vite.',
    keywords:
      'facturation site internet, devis communication, forfait maintenance, prestations marketing, catalogue facturation',
    ogImage: '/images/facturio-prestations.jpg',
    ogImageAlt:
      'Illustration PrestaFacture : personnage jonglant avec des icônes web, marketing, design et maintenance.',
  },
  fonctionnalites: {
    title: 'Devis, factures et paiement en ligne',
    description:
      'Devis acceptés en ligne, factures PDF, lien Stripe, TVA France et Europe, abonnements clients et indicateur de conformité pour la réforme 2026.',
    keywords:
      'fonctionnalités facturation, devis en ligne, paiement facture Stripe, TVA facture, abonnement client facturation',
    ogImage: '/images/facturio-features.jpg',
    ogImageAlt:
      'Illustration PrestaFacture : envoi de devis, paiement mobile et facture PDF avec badge de conformité.',
  },
  facturationElectronique: {
    title: 'Facturation électronique 2026 — guide pratique',
    description:
      'Réception obligatoire dès septembre 2026 : calendrier, simulateur d\'échéances et contrôles SIRET/SIREN sur vos factures. Préparez-vous sans changer d\'outil.',
    keywords:
      'facturation électronique 2026, réforme facture électronique, plateforme agréée, réception facture électronique, conformité facture B2B',
    ogImage: '/images/facturio-efacture.jpg',
    ogImageAlt:
      'Illustration PrestaFacture : transformation d\'une facture papier en fichier XML sécurisé pour la réforme 2026.',
  },
  tarifs: {
    title: 'Tarifs — gratuit, Pro et e-facture',
    description:
      'Plan gratuit : 25 factures/mois. Pro 12 €/mois illimité. Pro + e-facture 24 €/mois pour anticiper septembre 2026. Sans engagement, essai gratuit.',
    keywords:
      'tarif logiciel facturation, facturation gratuite freelance, abonnement facturation, prix PrestaFacture, offre e-facture',
    ogImage: '/images/facturio-pricing.jpg',
    ogImageAlt:
      'Illustration PrestaFacture : personnage grimpant des paliers de formules avec pièces et couronne.',
  },
  legal: {
    title: 'Mentions légales',
    description: 'Mentions légales, éditeur et informations juridiques du service PrestaFacture.',
  },
  privacy: {
    title: 'Politique de confidentialité',
    description: 'Traitement des données personnelles (RGPD), cookies et vos droits sur PrestaFacture.',
  },
  terms: {
    title: "Conditions d'utilisation",
    description: "Conditions générales d'utilisation du logiciel PrestaFacture.",
  },
  cgv: {
    title: 'Conditions générales de vente',
    description: 'CGV des abonnements PrestaFacture : Free, Pro, Pro + e-facture et Agence.',
  },
} as const

/**
 * Nom de marque pour titres et Open Graph.
 * - `VITE_APP_NAME` : forcé au build (par domaine / déploiement)
 * - Sinon : premier segment du hostname (ex. devis.mondomaine.fr → Devis)
 * - localhost : chaîne vide → titre de page seul, sans suffixe
 */
export function getSiteBrandName(): string {
  const env = import.meta.env.VITE_APP_NAME
  if (env !== undefined && env !== null) {
    const trimmed = String(env).trim()
    if (trimmed) return trimmed
  }

  if (typeof window === 'undefined') return SEO_BRAND_NAME

  const host = window.location.hostname
  if (!host || host === 'localhost' || host === '127.0.0.1') return SEO_BRAND_NAME

  const segment = host.split('.')[0]
  if (!segment || segment === 'www') return SEO_BRAND_NAME

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
  title: MARKETING_SEO.home.title,
  description: SEO_HOME_DESCRIPTION,
  tagline: SITE_TAGLINE,
} as const
