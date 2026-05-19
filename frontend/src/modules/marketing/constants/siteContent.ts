/** Contenu marketing aligné sur docs/planning (positionnement, monétisation, réforme 2026). */

export const SITE_TAGLINE =
  'Devis, factures et compta pour les dev & agences web'

export const SITE_DESCRIPTION =
  'Centralisez devis, facturation, TVA et suivi comptable — pensé pour les freelances développeurs et les agences web, sans tableur ni logiciel généraliste.'

export const EFACTURE_ROADMAP_DISCLAIMER =
  'Le module facturation électronique (Factur-X, Plateforme Agréée) est en cours de développement. Aujourd’hui, Facturio couvre devis, factures PDF, envoi email et paiements Stripe. Le palier Pro + e-facture vous réserve l’accès dès la mise en production du connecteur PA.'

export const REFORM_DATES = {
  reception: '1er septembre 2026',
  emissionEti: '1er septembre 2026',
  emissionPme: '1er septembre 2027',
} as const

/** Navigation publique — libellés courts pour tablette */
export const PUBLIC_NAV = [
  { to: '/', label: 'Accueil', shortLabel: 'Accueil' },
  { to: '/prestations', label: 'Prestations', shortLabel: 'Métier' },
  { to: '/fonctionnalites', label: 'Fonctionnalités', shortLabel: 'Fonctions' },
  { to: '/facturation-electronique', label: 'Réforme 2026', shortLabel: '2026' },
  { to: '/tarifs', label: 'Tarifs', shortLabel: 'Tarifs' },
] as const

export const REFORM_HIGHLIGHTS = [
  {
    title: 'Contrôle de conformité',
    description: 'Score de préparation par facture : SIRET, SIREN client B2B, mentions et lignes.',
  },
  {
    title: 'Export Factur-X (XML)',
    description: 'Génération du fichier structuré EN 16931 — base avant envoi Plateforme Agréée.',
  },
  {
    title: 'Vous restez dans Facturio',
    description: 'Catalogue, devis, missions : la PA partenaire assurera la transmission réglementaire.',
  },
] as const

export const VERTICAL_SEGMENTS = [
  {
    title: 'Développement web',
    description: 'Sites vitrine, refontes, intégrations — forfaits, acomptes et devis structurés.',
  },
  {
    title: 'Logiciel & apps métier',
    description: 'Applications sur mesure, jalons de projet et facturation par phase.',
  },
  {
    title: 'Automatisation & API',
    description: 'Intégrations CRM, migrations, scripts — régie ou forfait par lot.',
  },
  {
    title: 'IA & maintenance',
    description: 'Abonnements mensuels, packs IA et contrats de support récurrents.',
  },
] as const

export const FEATURES = [
  {
    title: 'Devis & acceptation client',
    description:
      'Devis en ligne, validation par le client, conversion en facture — idéal pour forfaits dev et missions en régie.',
  },
  {
    title: 'Facturation missions',
    description:
      'Catalogue de prestations (dev, intégration, maintenance), lignes claires et PDF prêts à envoyer.',
  },
  {
    title: 'Comptabilité intégrée',
    description: 'Écritures automatiques, balance et export FEC — le minimum vital pour suivre votre activité.',
  },
  {
    title: 'TVA FR & UE B2B',
    description: 'Taux adaptés, autoliquidation intracommunautaire et règles export pour clients européens.',
  },
  {
    title: 'Encaissement Stripe',
    description: 'Liens de paiement sur vos factures avec votre compte Stripe prestataire.',
  },
  {
    title: 'Réforme e-facture 2026',
    description: 'Contrôle SIREN/SIRET et export Factur-X — préparation à la facturation électronique B2B.',
  },
] as const

export type PricingPlan = {
  id: string
  name: string
  price: string
  period: string
  description: string
  features: readonly string[]
  cta: string
  highlighted: boolean
  badge?: string
}

export const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: '€ / mois',
    description: 'Pour tester et les très petits volumes.',
    features: [
      'Jusqu’à 10 factures / mois',
      '1 organisation',
      'Devis & PDF',
      'Catalogue de base',
      'Prospection non incluse',
    ],
    cta: 'Commencer gratuitement',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '12',
    period: '€ / mois',
    description: 'Le cœur de métier pour freelances et micro-agences.',
    features: [
      'Factures & devis illimités',
      'Prospection ProspectLab',
      'Clients & catalogue complet',
      'Envoi email & liens publics',
      'Paiements Stripe (votre compte)',
      'Exports & compta de base',
    ],
    cta: 'Essayer Pro',
    highlighted: true,
  },
  {
    id: 'pro-efacture',
    name: 'Pro + e-facture',
    price: '24',
    period: '€ / mois',
    description: 'Réservation du module e-facture (PA partenaire) — livraison progressive.',
    features: [
      'Tout le plan Pro',
      'Rapport conformité par facture',
      'Export Factur-X (XML)',
      'Connexion PA (à venir)',
      'E-reporting (à venir)',
    ],
    cta: 'Réserver le palier',
    highlighted: false,
    badge: '2026',
  },
  {
    id: 'agency',
    name: 'Agence',
    price: '59',
    period: '€ / mois',
    description: 'Pour petites équipes et studios.',
    features: [
      'Multi-utilisateurs (à venir)',
      'Missions & acomptes avancés',
      'Support prioritaire',
      'Branding PDF optionnel',
    ],
    cta: 'Nous contacter',
    highlighted: false,
  },
]

export const REFORM_STEPS = [
  {
    date: 'Sept. 2026',
    title: 'Réception obligatoire',
    body: 'Toutes les entreprises assujetties à la TVA en France doivent pouvoir recevoir des factures électroniques B2B.',
  },
  {
    date: 'Sept. 2026',
    title: 'Émission ETI & grandes entreprises',
    body: 'Obligation d’émettre en format structuré (Factur-X, UBL ou CII) via une Plateforme Agréée.',
  },
  {
    date: 'Sept. 2027',
    title: 'Émission PME & micro',
    body: 'Extension aux PME et micro-entreprises — anticiper dès maintenant limite les migrations précipitées.',
  },
] as const
