/** Contenu marketing aligné sur docs/planning (positionnement, monétisation, réforme 2026). */

export const SITE_TAGLINE = 'Facturez vos missions dev — conforme 2026'

export const SITE_DESCRIPTION =
  'Devis, factures, TVA et pré-compta pour freelances développeurs et agences web. Catalogue de prestations numériques, score conformité e-facture et export FEC — sans tableur ni logiciel généraliste.'

export const EFACTURE_ROADMAP_DISCLAIMER =
  'Le connecteur Plateforme Agréée et l’e-reporting sont en cours de développement. Aujourd’hui : devis, factures PDF, score de conformité, export Factur-X (XML), paiements Stripe. Le palier Pro + e-facture réserve l’accès dès la mise en production PA.'

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

export const VALUE_PROPOSITIONS = [
  {
    title: 'Vertical métier',
    description: 'Catalogue dev, intégration, maintenance et IA — pas un logiciel pour tout le monde.',
  },
  {
    title: 'Réforme 2026',
    description: 'Score de conformité et Factur-X dès maintenant ; PA partenaire en déploiement.',
  },
  {
    title: 'Léger & exportable',
    description: 'Pré-compta, FEC et bases URSSAF — votre expert-comptable garde la main.',
  },
] as const

export const REFORM_HIGHLIGHTS = [
  {
    title: 'Assistant conformité',
    description:
      'Score de préparation par facture : SIRET, SIREN client B2B, mentions obligatoires et lignes exploitables fiscalement.',
  },
  {
    title: 'Export Factur-X (XML)',
    description: 'Fichier structuré EN 16931 — base avant transmission Plateforme Agréée partenaire.',
  },
  {
    title: 'Réception dès sept. 2026',
    description:
      'Toutes les entreprises TVA doivent recevoir des e-factures en 2026 — anticipez avant l’embouteillage de rentrée.',
  },
] as const

export const VERTICAL_SEGMENTS = [
  {
    title: 'Développement web',
    description: 'Sites vitrine, refontes, intégrations — forfaits, acomptes 30/70 et devis structurés.',
  },
  {
    title: 'Logiciel & apps métier',
    description: 'Applications sur mesure, jalons de projet et facturation par phase.',
  },
  {
    title: 'Automatisation & API',
    description: 'Intégrations CRM, migrations, n8n/Make — régie (TJM) ou forfait par lot.',
  },
  {
    title: 'IA & maintenance',
    description: 'Abonnements mensuels, packs IA, SLA et contrats de support récurrents.',
  },
] as const

export const WORKFLOWS = [
  {
    title: 'Forfait site ou application',
    steps: [
      'Devis depuis le catalogue (livrables & hors périmètre)',
      'Acompte 30 % à la commande',
      'Solde à la livraison',
      'PDF, email et lien de paiement Stripe',
    ],
  },
  {
    title: 'Maintenance & SLA',
    steps: [
      'Contrat mensuel ou annuel (abonnements)',
      'Facturation récurrente',
      'Suivi encaissements et MRR',
      'Préparation e-reporting 2026',
    ],
  },
  {
    title: 'Régie & intégration',
    steps: [
      'Lignes heures × TJM (time tracking à venir)',
      'Descriptions techniques par ligne',
      'TVA FR ou autoliquidation UE B2B',
      'Export FEC vers expert-comptable',
    ],
  },
] as const

export const CATALOG_PACKS = [
  {
    id: 'agence-web',
    name: 'Pack Agence web',
    price: '19',
    priceNote: '€ achat unique',
    description: '~30 prestations typées : vitrine, refonte, SEO, formation.',
    cta: 'Inclure à l’inscription',
  },
  {
    id: 'automation',
    name: 'Pack Automatisation',
    price: '15',
    priceNote: '€ achat unique',
    description: 'Intégrations API, n8n/Make, migrations et scripts.',
    cta: 'Voir avec Pro',
  },
  {
    id: 'maintenance',
    name: 'Pack Maintenance & SLA',
    price: '12',
    priceNote: '€ ou +3 €/mois',
    description: 'Hébergement, correctifs, monitoring et contrats récurrents.',
    cta: 'Voir avec Pro',
  },
] as const

export const FEATURES = [
  {
    title: 'Devis & portail client',
    description:
      'Devis en ligne, acceptation/refus public, conversion en facture — idéal forfaits dev et missions régie.',
  },
  {
    title: 'Catalogue prestations',
    description:
      'Bibliothèque dev, SaaS, maintenance et packs — filtres par type, langage et objectif métier.',
  },
  {
    title: 'Facturation & avoirs',
    description:
      'Numérotation, paiements partiels, notes de crédit et traçabilité ISCA (inaltérabilité).',
  },
  {
    title: 'Encaissement Stripe',
    description: 'Liens de paiement sur vos factures avec votre compte Stripe prestataire (séparé de l’abo Facturio).',
  },
  {
    title: 'TVA FR & UE B2B',
    description: 'Taux adaptés, autoliquidation intracommunautaire et export hors UE.',
  },
  {
    title: 'Conformité 2026',
    description: 'Score par facture, SIREN client, export Factur-X — palier Pro + e-facture pour la PA à venir.',
  },
] as const

export const FEATURES_COMMERCIAL = [
  {
    title: 'Prospection ProspectLab',
    description: 'Pipeline, scoring et CRM léger — inclus dès le plan Pro.',
  },
  {
    title: 'Abonnements & MRR',
    description: 'Plans récurrents pour maintenance et licences SaaS livrées au client.',
  },
  {
    title: 'Packs & bundles',
    description: 'Templates de prestations groupées pour accélérer devis et factures.',
  },
  {
    title: 'Liens publics',
    description: 'Partage devis et factures sans compte client — paiement en un clic.',
  },
] as const

export const FEATURES_COMPTA = [
  {
    title: 'Écritures automatiques',
    description: 'Ventes, encaissements, achats services, paie et contributions micro-social.',
  },
  {
    title: 'Export FEC',
    description: 'Fichier pour votre expert-comptable — balance et grand livre côté API.',
  },
  {
    title: 'URSSAF & C3S',
    description: 'Bases de déclaration et paiements URSSAF intégrés au module compta.',
  },
  {
    title: 'Quotas par plan',
    description: 'Free : 25 factures/mois ; Pro illimité — incitation claire à monter en gamme.',
  },
] as const

export const FEATURES_ROADMAP = [
  {
    title: 'Connexion PA partenaire',
    description: 'Émission et réception e-factures B2B via solution compatible (en développement).',
  },
  {
    title: 'E-reporting',
    description: 'B2C, international et encaissements — calendrier aligné réforme 2026–2027.',
  },
  {
    title: 'Time tracking → facture',
    description: 'Saisie heures et lignes TJM automatiques pour la régie.',
  },
  {
    title: 'Vue missions / projets',
    description: 'Devis → factures → paiements regroupés par client et par mission.',
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
    description: 'Découvrir Facturio et les tout petits volumes.',
    features: [
      'Jusqu’à 25 factures / mois (réinitialisé chaque mois)',
      '1 organisation',
      'Devis & PDF illimités',
      'Catalogue de base (seed)',
      'Score conformité (lecture)',
      'Sans prospection ProspectLab',
    ],
    cta: 'Commencer gratuitement',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '12',
    period: '€ / mois',
    description: 'Le quotidien du freelance dev et de la micro-agence.',
    features: [
      'Factures & devis illimités',
      'Prospection ProspectLab',
      'Clients, catalogue & packs',
      'Email, PDF & liens publics',
      'Stripe (votre compte)',
      'Export FEC & compta de base',
    ],
    cta: 'Essayer Pro — 1er devis en 10 min',
    highlighted: true,
    badge: 'Recommandé',
  },
  {
    id: 'pro-efacture',
    name: 'Pro + e-facture',
    price: '24',
    period: '€ / mois',
    description: 'Anticipez sept. 2026 : réception + émission PA dès disponibilité.',
    features: [
      'Tout le plan Pro',
      'Rapport conformité avancé',
      'Export Factur-X (XML)',
      'Réservation connecteur PA',
      'E-reporting (à venir)',
      'Priorité feuille de route 2026',
    ],
    cta: 'Sécuriser ma conformité 2026',
    highlighted: false,
    badge: 'Réforme 2026',
  },
  {
    id: 'agency',
    name: 'Agence',
    price: '59',
    period: '€ / mois',
    description: 'Petites équipes, studios et intégrateurs à plusieurs.',
    features: [
      'Multi-utilisateurs (à venir)',
      'Missions & acomptes avancés',
      'Support prioritaire',
      'Branding PDF personnalisé',
      'Packs catalogue en option',
    ],
    cta: 'Parler à l’équipe',
    highlighted: false,
  },
]

export const PRICING_ADDONS_INTRO =
  'Enrichissez votre catalogue sans tout saisir à la main — idéal dès la première connexion.'

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
    body: 'Extension aux PME et micro-entreprises — anticiper limite les migrations précipitées de rentrée.',
  },
] as const

export const PRICING_FAQ = [
  {
    q: 'Je suis micro-entreprise : quand suis-je concerné ?',
    a: 'Réception des e-factures : dès le 1er septembre 2026 pour toutes les structures assujetties à la TVA. Émission : pour les micro et PME, échéance au 1er septembre 2027 — mais vos clients ETI pourront vous demander du électronique plus tôt.',
  },
  {
    q: 'Pourquoi le palier Pro + e-facture ?',
    a: 'La réforme impose le passage par une Plateforme Agréée. Ce palier finance le connecteur PA, l’e-reporting et vous place en priorité sur la feuille de route conformité — sans payer une compta complète type Indy.',
  },
  {
    q: 'Facturio remplace mon expert-comptable ?',
    a: 'Non. Facturation verticale + pré-compta (FEC, balance). Votre expert garde la liasse ; vous gagnez du temps sur le cycle commercial.',
  },
  {
    q: 'Les packs catalogue sont-ils obligatoires ?',
    a: 'Non. Le seed DanielCraft suffit pour démarrer. Les packs (Agence web, Automatisation, Maintenance) accélèrent l’onboarding pour 12 à 19 € en achat unique ou +3 €/mois sur Pro.',
  },
  {
    q: 'Comment limiter l’accès sur le plan Free ?',
    a: 'Maximum 25 factures créées par mois calendaire. Le compteur repart à zéro le 1er de chaque mois. Au-delà du quota, la création est bloquée jusqu’au mois suivant ou passage au plan Pro — devis et PDF restent disponibles.',
  },
] as const

/** Libellés CTA réutilisables */
export const CTA = {
  signupFree: { label: 'Commencer gratuitement', to: '/signup' },
  signupPro: { label: 'Passer Pro', to: '/parametres/abonnement' },
  efacture2026: { label: 'Préparer la réforme 2026', to: '/facturation-electronique' },
  pricing: { label: 'Comparer les offres', to: '/tarifs' },
  prestations: { label: 'Voir les parcours métier', to: '/prestations' },
  features: { label: 'Toutes les fonctionnalités', to: '/fonctionnalites' },
  reserveEfacture: { label: 'Réserver Pro + e-facture', to: '/parametres/abonnement' },
} as const
