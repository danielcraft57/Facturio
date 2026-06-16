import type { ReactNode } from 'react'
import BusinessIcon from '@mui/icons-material/Business'
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import PaymentIcon from '@mui/icons-material/Payment'
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip'
import StorageIcon from '@mui/icons-material/Storage'
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import SpeedIcon from '@mui/icons-material/Speed'
import type { BillingUsage } from '../../services/billing'

export type SettingsNavSection = 'compte' | 'facturation' | 'donnees' | 'api'

export type SettingsNavItem = {
  to: string
  label: string
  description: string
  icon: ReactNode
  section?: SettingsNavSection
  /** Réservé aux plans Pro (API publique) */
  requiresPro?: boolean
  /** Visible uniquement sur le plan Free */
  requiresFree?: boolean
  /** Visible mais réservé Pro sur le plan courant */
  planLocked?: boolean
}

export type SettingsNavFilter = {
  publicApiEnabled?: boolean
  isFreePlan?: boolean
}

/** Ordre d'affichage des sections dans la sidebar et l'index paramètres. */
export const SETTINGS_SECTION_ORDER: SettingsNavSection[] = [
  'compte',
  'facturation',
  'donnees',
  'api',
]

/** Libellés des sections paramètres. */
export const SETTINGS_SECTION_LABELS: Record<SettingsNavSection, string> = {
  compte: 'Compte',
  facturation: 'Facturation',
  donnees: 'Données',
  api: 'API Pro',
}

export type SettingsNavGroup = {
  section: SettingsNavSection | 'overview'
  label: string
  items: SettingsNavItem[]
}

/**
 * Regroupe les entrées paramètres pour la sidebar et la page d'accueil.
 *
 * @param items - Entrées déjà filtrées par plan
 */
export function groupSettingsNavItems(items: SettingsNavItem[]): SettingsNavGroup[] {
  const overview = items.filter((item) => item.to === '/parametres')
  const groups: SettingsNavGroup[] = []

  if (overview.length > 0) {
    groups.push({ section: 'overview', label: "Vue d'ensemble", items: overview })
  }

  for (const section of SETTINGS_SECTION_ORDER) {
    const sectionItems = items.filter((item) => item.section === section)
    if (sectionItems.length > 0) {
      groups.push({
        section,
        label: SETTINGS_SECTION_LABELS[section],
        items: sectionItems,
      })
    }
  }

  return groups
}

export const settingsNavItems: SettingsNavItem[] = [
  {
    to: '/parametres',
    label: "Vue d'ensemble",
    description: 'Accès rapide à tous les réglages',
    icon: <DashboardCustomizeIcon fontSize="small" />,
  },
  {
    to: '/parametres/entreprise',
    label: 'Entreprise',
    description: 'Identité, SIRET, adresse, contact',
    icon: <BusinessIcon fontSize="small" />,
    section: 'compte',
  },
  {
    to: '/parametres/abonnement',
    label: 'Abonnement',
    description: 'Plan Free, Pro, facturation Stripe',
    icon: <CardMembershipIcon fontSize="small" />,
    section: 'compte',
  },
  {
    to: '/parametres/quotas',
    label: 'Quotas & usage',
    description: 'Limites mensuelles du plan Free',
    icon: <SpeedIcon fontSize="small" />,
    section: 'compte',
    requiresFree: true,
  },
  {
    to: '/parametres/facturation-electronique',
    label: 'Réforme 2026',
    description: 'Conformité e-facture, export Factur-X — connecteur PA à venir',
    icon: <VerifiedUserIcon fontSize="small" />,
    section: 'facturation',
  },
  {
    to: '/parametres/paiements',
    label: 'Paiements',
    description: 'Stripe sur vos factures',
    icon: <PaymentIcon fontSize="small" />,
    section: 'facturation',
  },
  {
    to: '/parametres/confidentialite',
    label: 'Confidentialité',
    description: 'Mentions sur pages clients',
    icon: <PrivacyTipIcon fontSize="small" />,
    section: 'donnees',
  },
  {
    to: '/parametres/donnees',
    label: 'Mes données',
    description: 'Export RGPD & suppression',
    icon: <StorageIcon fontSize="small" />,
    section: 'donnees',
  },
  {
    to: '/parametres/tokens',
    label: 'API — Jetons',
    description: 'Accès programmatique Bearer (Pro)',
    icon: <VpnKeyIcon fontSize="small" />,
    section: 'api',
    requiresPro: true,
  },
  {
    to: '/parametres/api-docs',
    label: 'API — Documentation',
    description: 'Endpoints publics REST (Pro)',
    icon: <MenuBookIcon fontSize="small" />,
    section: 'api',
    requiresPro: true,
  },
]

export function isSettingsPathActive(pathname: string, to: string): boolean {
  if (to === '/parametres') return pathname === '/parametres'
  return pathname === to || pathname.startsWith(`${to}/`)
}

/**
 * Construit le filtre menu paramètres à partir de l'usage billing.
 *
 * @param usage - Usage billing courant (null si non chargé)
 */
export function settingsNavFilterFromUsage(usage: BillingUsage | null | undefined): SettingsNavFilter {
  return {
    publicApiEnabled: usage?.limits.publicApi === true,
    isFreePlan: usage?.plan === 'FREE',
  }
}

/**
 * Filtre les entrées Free-only ; les entrées Pro restent visibles avec planLocked.
 *
 * @param items - Entrées menu paramètres
 * @param filter - Options de filtrage (API publique, plan Free)
 */
export function filterSettingsNavItems(
  items: SettingsNavItem[],
  filter: SettingsNavFilter = {},
): SettingsNavItem[] {
  return items
    .filter((item) => {
      if (item.requiresFree && filter.isFreePlan !== true) return false
      return true
    })
    .map((item) => ({
      ...item,
      planLocked: item.requiresPro === true && filter.publicApiEnabled !== true,
    }))
}
