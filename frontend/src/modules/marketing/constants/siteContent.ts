/** Contenu marketing — freelances, studios et petites équipes du digital. */

export const SITE_TAGLINE = 'Devis et factures pour le digital — sans prise de tête'

export const SITE_DESCRIPTION =
  'PrestaFacture, c\'est l\'outil pour vos devis, factures et suivi client. Pensé pour les freelances, studios et petites équipes : sites web, communication, marketing — catalogue, paiement en ligne, TVA et réforme 2026.'

/** Résumé court des limites du plan Free — réutilisé sur toutes les pages publiques. */
export const FREE_PLAN_SUMMARY =
  '25 factures, 10 devis et 20 envois par email par mois (PDF avec filigrane, sans export pour le comptable ni branchement technique)'

export const BETA_PROGRAM = {
  badge: 'Offre beta testeurs',
  title: '3 mois gratuits, tout inclus',
  description:
    'Un code partagé sur les réseaux ? Même code pour tout le monde, jusqu\'à épuisement des places. Collez-le à l\'inscription ou dans Paramètres → Abonnement. Tout est débloqué pendant 90 jours.',
  durationLabel: '90 jours',
  steps: [
    'Récupérez le code campagne (quelques lettres ou chiffres)',
    'Créez votre compte et entrez le code',
    'Profitez de tout (Pro + Agence) pendant 3 mois',
  ] as const,
} as const

export const PRICING_SECTION = {
  title: 'Des tarifs clairs',
  subtitle:
    'Gratuit pour essayer. Pro pour le quotidien. Pro + e-facture pour être prêt avant septembre 2026.',
} as const

export const MARKETING_CTA = {
  defaultTitle: 'Prêt à facturer vos missions sereinement ?',
  defaultSubtitle: `Ouvrez un compte en quelques minutes. ${FREE_PLAN_SUMMARY}.`,
  landingTitle: 'Votre premier devis en 10 minutes',
  landingSubtitle:
    'Compte gratuit, exemples de prestations déjà dedans. Passez Pro quand vous en avez besoin ou quand vous dépassez les limites du gratuit.',
  pricingTitle: 'Commencez gratuit — montez en gamme quand ça accélère',
  pricingSubtitle: `Le gratuit (${FREE_PLAN_SUMMARY}) suffit pour tester. Pro dès que vous voulez l\'export comptable ou des volumes plus larges.`,
} as const

export const EFACTURE_ROADMAP_DISCLAIMER =
  'L\'envoi automatique vers la plateforme officielle et les déclarations associées arrivent bientôt — ce n\'est pas encore branché. Aujourd\'hui : devis, factures PDF, indicateur de conformité et paiements Stripe. L\'offre Pro + e-facture vous réserve la place dès que ce sera prêt.'

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
    title: 'Pensé pour le digital',
    description: 'Sites, campagnes, identité visuelle, maintenance client — pas un logiciel pour tout le monde.',
  },
  {
    title: 'Prêt pour 2026',
    description: 'Indicateur de conformité sur chaque facture. La suite (plateforme agréée) arrive progressivement.',
  },
  {
    title: 'Léger et partageable',
    description: 'Export pour votre comptable. Vous facturez, il valide — chacun son métier.',
  },
] as const

export const REFORM_HIGHLIGHTS = [
  {
    title: 'Contrôle avant envoi',
    description:
      'Chaque facture a un petit score : SIRET, coordonnées client, mentions obligatoires… Vous voyez tout de suite ce qui manque.',
  },
  {
    title: 'Même outil, nouvelle obligation',
    description:
      'Vous continuez à faire vos devis et factures dans PrestaFacture. La connexion à la plateforme officielle s\'ajoutera quand elle sera prête.',
  },
  {
    title: 'Réception dès septembre 2026',
    description:
      'Toutes les entreprises assujetties à la TVA devront recevoir des factures électroniques. Mieux vaut s\'y prendre avant la rentrée.',
  },
] as const

export const VERTICAL_SEGMENTS = [
  {
    title: 'Sites & e-commerce',
    description: 'Vitrine, refonte, boutique en ligne — forfaits, acompte 30 % et solde à la livraison.',
  },
  {
    title: 'Communication & réseaux sociaux',
    description: 'Campagnes, community management, contenus — forfait mensuel ou au projet.',
  },
  {
    title: 'Branding & créa',
    description: 'Logo, charte, supports print et digital — devis clair, facturation par étape.',
  },
  {
    title: 'Maintenance & abonnements',
    description: 'Contrats au mois ou à l\'année, hébergement, mises à jour et support client.',
  },
] as const

export const WORKFLOWS = [
  {
    title: 'Projet site ou campagne',
    steps: [
      'Devis depuis votre catalogue (ce qui est inclus et ce qui ne l\'est pas)',
      'Acompte 30 % à la commande',
      'Solde à la livraison',
      'PDF, email au client et lien de paiement si besoin',
    ],
  },
  {
    title: 'Contrat au mois',
    steps: [
      'Abonnement mensuel ou annuel dans l\'outil',
      'Facture qui part toute seule chaque mois',
      'Suivi des paiements reçus',
      'Préparation pour les obligations 2026',
    ],
  },
  {
    title: 'Mission à la journée',
    steps: [
      'Heures passées × votre tarif journalier',
      'Description claire par prestation',
      'TVA France ou client à l\'étranger (UE)',
      'Export pour le comptable en fin de mois',
    ],
  },
] as const

export const CATALOG_PACKS_JUNIOR = [
  {
    id: 'junior-premier-client',
    name: 'Premier client',
    price: '9',
    priceNote: '€ achat unique',
    description: 'Site vitrine, pages, SEO — pour démarrer une première mission.',
    cta: 'Idéal pour débuter',
    techStack: 'Web · SEO',
  },
  {
    id: 'junior-fullstack-ts',
    name: 'Site & app sur mesure',
    price: '14',
    priceNote: '€ achat unique',
    description: 'Site dynamique, espace client, intégrations.',
    cta: 'Projets avancés',
    techStack: 'Web · App',
  },
  {
    id: 'junior-wordpress',
    name: 'WordPress',
    price: '12',
    priceNote: '€ achat unique',
    description: 'Thème, maintenance, dépannage.',
    cta: 'Agences WP',
    techStack: 'WordPress',
  },
  {
    id: 'junior-python',
    name: 'Outils & automatisations',
    price: '14',
    priceNote: '€ achat unique',
    description: 'Scripts, API, petits outils métier.',
    cta: 'Tech & data',
    techStack: 'API · Scripts',
  },
  {
    id: 'junior-ia',
    name: 'IA & contenus',
    price: '13',
    priceNote: '€ achat unique',
    description: 'Chatbot, génération de contenu, workflows.',
    cta: 'Communication & IA',
    techStack: 'IA · No-code',
  },
] as const

export const CATALOG_PACKS = [
  {
    id: 'pack-agence-web',
    name: 'Pack Web & digital',
    price: '19',
    priceNote: '€ achat unique',
    description: 'Sites, refontes, SEO, formation client.',
    cta: 'Inclure à l\'inscription',
  },
  {
    id: 'pack-automation',
    name: 'Pack Marketing digital',
    price: '15',
    priceNote: '€ achat unique',
    description: 'Réseaux sociaux, newsletters, campagnes, tracking.',
    cta: 'Voir avec Pro',
  },
  {
    id: 'pack-maintenance',
    name: 'Pack Maintenance',
    price: '12',
    priceNote: '€ ou +3 €/mois',
    description: 'Contrats récurrents, support, petites évolutions.',
    cta: 'Voir avec Pro',
  },
] as const

export const FEATURES = [
  {
    title: 'Devis en ligne',
    description:
      'Le client reçoit un lien, accepte ou refuse, vous transformez en facture en un clic. Idéal forfaits et missions au mois.',
  },
  {
    title: 'Catalogue de prestations',
    description:
      'Vos offres types (site, campagne, logo, maintenance…) prêtes à glisser dans un devis. Fini de tout retaper.',
  },
  {
    title: 'Factures & avoirs',
    description:
      'Numérotation automatique, paiements en plusieurs fois, notes de crédit — tout est tracé.',
  },
  {
    title: 'Paiement Stripe',
    description: 'Lien de paiement sur la facture avec votre compte Stripe (séparé de l\'abonnement PrestaFacture).',
  },
  {
    title: 'TVA France & Europe',
    description: 'Taux adaptés, client professionnel UE, export hors Europe — sans se prendre la tête.',
  },
  {
    title: 'Conformité 2026',
    description: 'Un indicateur sur chaque facture — l\'offre Pro + e-facture ouvrira la suite quand la connexion officielle sera prête.',
  },
] as const

export const FEATURES_COMMERCIAL = [
  {
    title: 'Abonnements clients',
    description: 'Factures récurrentes pour la maintenance, la com mensuelle ou un forfait suivi.',
  },
  {
    title: 'Packs & forfaits',
    description: 'Groupez vos prestations types pour chiffrer plus vite.',
  },
  {
    title: 'Liens publics',
    description: 'Partagez devis et factures sans que le client ait besoin de compte — paiement en un clic.',
  },
] as const

export const FEATURES_COMPTA = [
  {
    title: 'Suivi automatique',
    description: 'Ventes et encaissements remontent dans votre tableau de bord, sans ressaisie.',
  },
  {
    title: 'Fichier pour le comptable',
    description: 'Un export à lui envoyer en fin de mois — balance, grand livre, le classique.',
  },
  {
    title: 'Aide aux déclarations',
    description: 'Des repères pour l\'URSSAF si vous êtes en micro ou indépendant.',
  },
  {
    title: 'Limites claires',
    description: 'Gratuit : quotas mensuels. Pro : vous facturez sans compter.',
  },
] as const

export const FEATURES_ROADMAP = [
  {
    title: 'Plateforme officielle',
    description: 'Envoi et réception des factures électroniques — en cours de développement.',
  },
  {
    title: 'Déclarations liées à la réforme',
    description: 'Les flux complémentaires prévus par la loi — calendrier 2026–2027.',
  },
  {
    title: 'Suivi du temps',
    description: 'Heures saisies → lignes de facture pour les missions facturées au jour.',
  },
  {
    title: 'Vue par projet',
    description: 'Devis, factures et paiements regroupés par client et par mission.',
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
    description: 'Pour découvrir et les tout petits volumes.',
    features: [
      'Jusqu\'à 25 factures / mois',
      'Jusqu\'à 10 devis / mois',
      '20 envois email / mois',
      'PDF avec filigrane PrestaFacture',
      'Catalogue d\'exemple fourni',
      'Indicateur conformité (lecture)',
      'Sans export comptable, suivi impayés ni connexion technique',
    ],
    cta: 'Commencer gratuitement',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '12',
    period: '€ / mois',
    description: 'Le quotidien d\'un freelance, d\'un studio ou d\'une petite équipe qui facture souvent.',
    features: [
      'Factures, devis et emails illimités',
      'Clients, catalogue et packs',
      'Suivi impayés, charges et connexions techniques',
      'Stripe (votre compte)',
      'Export comptable et suivi de base',
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
    description: 'Pour anticiper septembre 2026 : conformité renforcée et accès prioritaire à la suite.',
    features: [
      'Tout le plan Pro',
      'Rapport de conformité détaillé',
      'Préparation facturation électronique',
      'Réservation plateforme agréée',
      'E-reporting (bientôt)',
      'Priorité sur les nouveautés 2026',
    ],
    cta: 'Me préparer pour 2026',
    highlighted: false,
    badge: 'Réforme 2026',
  },
  {
    id: 'agency',
    name: 'Agence',
    price: '59',
    period: '€ / mois',
    description: 'Petites équipes : plusieurs personnes sur le même compte.',
    features: [
      'Plusieurs utilisateurs',
      'Tout Pro + e-facture inclus',
      'Suivi impayés, charges et connexions techniques',
      'Support prioritaire',
      'Packs catalogue en option',
    ],
    cta: 'Nous contacter',
    highlighted: false,
  },
]

export const PRICING_ADDONS_INTRO =
  'Des modèles de prestations à ajouter d\'un coup — pratique dès la première connexion.'

export const REFORM_STEPS = [
  {
    date: 'Sept. 2026',
    title: 'Réception obligatoire',
    body: 'Toutes les entreprises assujetties à la TVA en France doivent pouvoir recevoir des factures électroniques de leurs fournisseurs.',
  },
  {
    date: 'Sept. 2026',
    title: 'Grandes structures',
    body: 'Les grosses boîtes et ETI doivent émettre en format électronique via une plateforme agréée.',
  },
  {
    date: 'Sept. 2027',
    title: 'PME & micro',
    body: 'Les plus petites structures suivent en 2027 — autant s\'organiser avant la ruée de septembre.',
  },
] as const

export const PRICING_FAQ = [
  {
    q: 'Je suis en micro-entreprise : je suis concerné quand ?',
    a: 'Réception des factures électroniques : dès le 1er septembre 2026 si vous êtes assujetti à la TVA. Émission : plutôt en 2027 pour les micro et PME — mais vos gros clients pourront déjà vous demander du électronique avant.',
  },
  {
    q: 'Pourquoi une offre Pro + e-facture ?',
    a: 'La loi impose bientôt de passer par une plateforme officielle. Cette offre finance le connecteur et vous met en avant — sans payer un gros logiciel de compta type Indy ou Pennylane.',
  },
  {
    q: 'PrestaFacture remplace mon comptable ?',
    a: 'Non. Vous faites devis et factures, l\'outil prépare l\'export. Votre expert-comptable garde la main sur la liasse officielle.',
  },
  {
    q: 'Les packs catalogue sont obligatoires ?',
    a: 'Non. Des exemples sont déjà là à l\'inscription. Les packs (web, communication, maintenance) servent à gagner du temps pour 12 à 19 € en une fois, ou +3 €/mois sur Pro.',
  },
  {
    q: 'C\'est quoi les limites du gratuit ?',
    a: '25 factures, 10 devis et 20 emails par mois. Pas d\'export pour le comptable, pas de suivi impayés/charges, pas de branchement technique. PDF avec un petit filigrane. Compteurs remis à zéro le 1er de chaque mois.',
  },
] as const

/** Libellés CTA réutilisables */
export const CTA = {
  signupFree: { label: 'Commencer gratuitement', to: '/signup', gaEvent: 'cta_signup' },
  betaSignup: { label: "S'inscrire avec un code beta", to: '/signup', gaEvent: 'cta_beta' },
  signupPro: { label: 'Passer Pro', to: '/parametres/abonnement', gaEvent: 'cta_pricing' },
  efacture2026: {
    label: 'Comprendre la réforme 2026',
    to: '/facturation-electronique',
    gaEvent: 'cta_efacture',
  },
  pricing: { label: 'Comparer les offres', to: '/tarifs', gaEvent: 'cta_pricing' },
  prestations: { label: 'Voir des exemples concrets', to: '/prestations', gaEvent: 'cta_prestations' },
  features: { label: 'Toutes les fonctionnalités', to: '/fonctionnalites', gaEvent: 'cta_signup' },
  reserveEfacture: {
    label: 'Offre Pro + e-facture',
    to: '/parametres/abonnement',
    gaEvent: 'cta_efacture',
  },
} as const

/** CTA marketing avec événement GA4 optionnel. */
export type MarketingCta = {
  label: string
  to: string
  gaEvent?: string
}
