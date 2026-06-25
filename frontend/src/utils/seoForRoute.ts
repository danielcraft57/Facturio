import { DEFAULT_KEYWORDS, DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_ALT, DEFAULT_SEO, MARKETING_SEO } from '../config/seo'
import { DOCUMENT_FOLDER_LABELS, isDocumentFolder } from '../types/documentFolders'
import type { SeoPayload, RobotsDirective } from './seoTypes'

const PRIVATE_PREFIXES = [
  '/dashboard',
  '/clients',
  '/devis',
  '/factures',
  '/archives',
  '/produits',
  '/taxes',
  '/abonnements',
  '/declarations',
  '/comptabilite',
  '/finance',
  '/parametres',
  '/installation',
  '/inscription/confirmation',
  '/demo',
  '/loaders',
]

const AUTH_PREFIXES = ['/login', '/signup', '/mot-de-passe', '/auth/', '/verifier-email', '/reinitialiser-mot-de-passe']

function normalizePath(pathname: string): string {
  return pathname.split('?')[0].replace(/\/+$/, '') || '/'
}

function robotsForPath(path: string): RobotsDirective {
  if (PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return 'noindex, nofollow'
  }
  if (AUTH_PREFIXES.some((p) => path === p || path.startsWith(p))) {
    return 'noindex, follow'
  }
  if (path.startsWith('/public/') || path.startsWith('/facture/') || path.startsWith('/dette/')) {
    return 'noindex, nofollow'
  }
  return 'index, follow'
}

type RouteSeo = Pick<SeoPayload, 'title' | 'description' | 'ogImage' | 'ogImageAlt' | 'keywords'>

const MARKETING: Record<string, RouteSeo> = {
  '/': MARKETING_SEO.home,
  '/prestations': MARKETING_SEO.prestations,
  '/fonctionnalites': MARKETING_SEO.fonctionnalites,
  '/facturation-electronique': MARKETING_SEO.facturationElectronique,
  '/tarifs': MARKETING_SEO.tarifs,
  '/legal': MARKETING_SEO.legal,
  '/privacy': MARKETING_SEO.privacy,
  '/terms': MARKETING_SEO.terms,
  '/cgv': MARKETING_SEO.cgv,
}

const APP_ROUTES: Record<string, RouteSeo> = {
  '/login': {
    title: 'Connexion',
    description: 'Connectez-vous à PrestaFacture pour gérer devis, factures et clients.',
  },
  '/signup': {
    title: 'Inscription gratuite',
    description:
      'Créez votre compte en quelques minutes : catalogue de prestations, devis et factures. Essai gratuit sans carte bancaire.',
  },
  '/mot-de-passe-oublie': {
    title: 'Mot de passe oublié',
    description: 'Réinitialisez votre mot de passe par email.',
  },
  '/installation': {
    title: 'Configuration initiale',
    description: 'Configurez votre entreprise et installez votre catalogue de prestations.',
  },
  '/inscription/confirmation': {
    title: 'Confirmer votre email',
    description: 'Validez votre adresse email pour accéder au tableau de bord.',
  },
  '/dashboard': {
    title: 'Tableau de bord',
    description: 'Vue d’ensemble de votre activité : devis, factures et indicateurs clés.',
  },
  '/clients': { title: 'Clients', description: 'Gérez vos clients et prospects.' },
  '/devis': { title: 'Devis', description: 'Créez et suivez vos devis.' },
  '/devis/archives': { title: 'Devis archivés', description: 'Consultez vos devis archivés.' },
  '/factures': { title: 'Factures', description: 'Émettez et suivez vos factures.' },
  '/factures/archives': { title: 'Factures archivées', description: 'Consultez vos factures archivées.' },
  '/archives': { title: 'Archives', description: 'Documents archivés.' },
  '/produits': { title: 'Produits', description: 'Catalogue de prestations et tarifs.' },
  '/taxes': { title: 'Fiscalité', description: 'TVA, déductions et simulations fiscales.' },
  '/abonnements': { title: 'Abonnements', description: 'Abonnements récurrents et facturation.' },
  '/declarations': { title: 'Déclarations', description: 'Déclarations et obligations.' },
  '/comptabilite': { title: 'Comptabilité', description: 'Suivi comptable simplifié.' },
  '/creances': {
    title: 'Créances',
    description: 'Factures clients impayées et relances.',
  },
  '/dettes': {
    title: 'Dettes',
    description: 'Créanciers et remboursements (reconnaissance de dette).',
  },
  '/finance/creances': {
    title: 'Créances',
    description: 'Factures clients impayées et relances.',
  },
  '/finance/dettes': {
    title: 'Dettes',
    description: 'Créanciers et remboursements (reconnaissance de dette).',
  },
  '/parametres': { title: 'Paramètres', description: 'Paramètres de votre compte et organisation.' },
  '/parametres/entreprise': { title: 'Entreprise', description: 'Identité légale et coordonnées de facturation.' },
  '/parametres/abonnement': { title: 'Abonnement', description: 'Formule et facturation de votre compte.' },
  '/parametres/quotas': { title: 'Quotas & usage', description: 'Limites mensuelles du plan Free.' },
  '/parametres/facturation-electronique': {
    title: 'Facturation électronique',
    description: 'Préparation réforme 2026 et indicateur de conformité sur vos factures.',
  },
  '/parametres/paiements': { title: 'Paiements', description: 'Stripe et encaissements en ligne.' },
  '/parametres/confidentialite': { title: 'Confidentialité', description: 'RGPD et export de données.' },
  '/parametres/donnees': { title: 'Données', description: 'Export et suppression de données.' },
  '/parametres/tokens': { title: 'Tokens API', description: 'Accès API pour intégrations.' },
  '/parametres/api-docs': { title: 'Documentation API', description: 'Référence de l’API.' },
}

function titleForDynamicPath(path: string): RouteSeo | null {
  if (path.startsWith('/verifier-email/')) {
    return { title: 'Vérification email', description: 'Confirmez votre adresse email.' }
  }
  if (path.startsWith('/reinitialiser-mot-de-passe/')) {
    return { title: 'Réinitialiser le mot de passe', description: 'Choisissez un nouveau mot de passe.' }
  }
  if (path.startsWith('/public/devis/') && path.endsWith('/accepter')) {
    return { title: 'Accepter le devis', description: 'Validez ce devis en ligne.' }
  }
  if (path.startsWith('/public/devis/') && path.endsWith('/refuser')) {
    return { title: 'Refuser le devis', description: 'Refusez ce devis en ligne.' }
  }
  if (path.startsWith('/public/devis/')) {
    return { title: 'Devis en ligne', description: 'Consultez ce devis partagé.' }
  }
  if (path.startsWith('/facture/') || path.startsWith('/public/factures/')) {
    return { title: 'Facture en ligne', description: 'Consultez ou réglez cette facture.' }
  }
  if (path.startsWith('/dette/')) {
    return {
      title: 'Reconnaissance de dette',
      description: 'Consultez le détail de cette dette partagée.',
    }
  }
  if (/^\/dettes\/voir\/[^/]+$/.test(path) || /^\/finance\/dettes\/voir\/[^/]+$/.test(path)) {
    return { title: 'Détail de la dette', description: 'Créancier, solde et remboursements.' }
  }
  if (/^\/factures\/[^/]+\/edit$/.test(path)) {
    return { title: 'Modifier la facture', description: 'Édition d’une facture.' }
  }
  if (/^\/devis\/[^/]+\/edit$/.test(path)) {
    return { title: 'Modifier le devis', description: 'Édition d’un devis.' }
  }

  const folderLabels: Record<string, string> = {
    inbox: 'Boîte de réception',
    archives: 'Archives',
    archive: 'Archives',
    sent: 'Envoyés',
    drafts: 'Brouillons',
    trash: 'Corbeille',
  }

  const clientsFolder = path.match(/^\/clients\/([^/]+)$/)
  if (clientsFolder) {
    const label = folderLabels[clientsFolder[1]] ?? clientsFolder[1]
    return { title: `Clients — ${label}`, description: `Liste clients : ${label}.` }
  }

  const devisFolder = path.match(/^\/devis\/([^/]+)$/)
  if (devisFolder && !['archives', 'archive'].includes(devisFolder[1])) {
    const label = folderLabels[devisFolder[1]] ?? devisFolder[1]
    return { title: `Devis — ${label}`, description: `Devis : ${label}.` }
  }

  const facturesFolder = path.match(/^\/factures\/([^/]+)$/)
  if (facturesFolder && !['archives', 'archive'].includes(facturesFolder[1])) {
    const label = folderLabels[facturesFolder[1]] ?? facturesFolder[1]
    return { title: `Factures — ${label}`, description: `Factures : ${label}.` }
  }

  if (path === '/dettes/archives' || path === '/finance/dettes/archives') {
    return { title: 'Archives — Dettes', description: 'Dettes archivées par période.' }
  }

  const dettesFolder = path.match(/^\/dettes\/([^/]+)$/) ?? path.match(/^\/finance\/dettes\/([^/]+)$/)
  if (dettesFolder && dettesFolder[1] !== 'voir') {
    const key = dettesFolder[1]
    const label = isDocumentFolder(key) ? DOCUMENT_FOLDER_LABELS[key] : key
    return { title: `Dettes — ${label}`, description: `Dettes : ${label}.` }
  }

  return null
}

/** Métadonnées SEO pour un chemin d’application. */
export function seoForRoute(pathname: string): SeoPayload {
  const path = normalizePath(pathname)
  const robots = robotsForPath(path)

  const exact = MARKETING[path] ?? APP_ROUTES[path] ?? titleForDynamicPath(path)

  if (exact) {
    return {
      title: exact.title,
      description: exact.description,
      robots,
      ogType: 'website',
      ogImage: exact.ogImage ?? DEFAULT_OG_IMAGE,
      ogImageAlt: exact.ogImageAlt ?? DEFAULT_OG_IMAGE_ALT,
      keywords: exact.keywords ?? DEFAULT_KEYWORDS,
      canonicalPath: path,
    }
  }

  return {
    title: DEFAULT_SEO.title,
    description: DEFAULT_SEO.description,
    robots,
    ogType: 'website',
    ogImage: DEFAULT_OG_IMAGE,
    ogImageAlt: DEFAULT_OG_IMAGE_ALT,
    keywords: DEFAULT_KEYWORDS,
    canonicalPath: path,
  }
}
