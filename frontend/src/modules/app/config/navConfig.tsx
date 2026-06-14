import type { ReactNode } from 'react'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import DescriptionIcon from '@mui/icons-material/Description'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import LocalAtmIcon from '@mui/icons-material/LocalAtm'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import GavelIcon from '@mui/icons-material/Gavel'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import BusinessIcon from '@mui/icons-material/Business'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CreditScoreIcon from '@mui/icons-material/CreditScore'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { CREANCES_PATH, DETTES_INBOX } from './encoursPaths'
import { filterSettingsNavItems, settingsNavItems, type SettingsNavFilter } from '../../account/settingsNav'

export type NavItemSection = 'activity' | 'encours' | 'compte' | 'facturation' | 'donnees' | 'api'

export type NavItem = {
  to: string
  label: string
  description?: string
  icon: ReactNode
  badge?: string
  /** Regroupement dans le mega-menu Commercial. */
  section?: NavItemSection
}

export type NavFeatured = {
  title: string
  description: string
  to: string
  cta: string
  secondaryCta?: { label: string; to: string }
  icon: ReactNode
  accent: 'navy' | 'emerald' | 'amber'
}

export type NavGroup = {
  id: string
  label: string
  overview: string
  overviewCta?: { label: string; to: string }
  items: NavItem[]
  featured: NavFeatured
  /** Panneau dense sans scroll (ex. Paramètres). */
  layout?: 'default' | 'compact'
}

export const navDashboard: NavItem = {
  to: '/dashboard',
  label: 'Tableau de bord',
  description: "Vue d'ensemble & indicateurs",
  icon: <DashboardIcon fontSize="small" />,
}

export const navGroups: NavGroup[] = [
  {
    id: 'commercial',
    label: 'Commercial',
    overview: 'Clients, devis, factures et catalogue — encours à part.',
    overviewCta: { label: 'Factures', to: '/factures/inbox' },
    featured: {
      title: 'Créer une facture',
      description: 'Émission rapide avec relances intégrées.',
      to: '/factures/inbox?create=1',
      cta: 'Nouvelle facture',
      icon: <AddCircleOutlineIcon />,
      accent: 'navy',
    },
    items: [
      {
        to: '/clients/inbox',
        label: 'Clients',
        description: 'Carnet acheteurs (≠ créanciers des dettes)',
        icon: <PeopleIcon fontSize="small" />,
        section: 'activity',
      },
      {
        to: '/devis/inbox',
        label: 'Devis',
        description: 'Propositions commerciales',
        icon: <DescriptionIcon fontSize="small" />,
        section: 'activity',
      },
      {
        to: '/factures/inbox',
        label: 'Factures',
        description: 'Émission et envoi',
        icon: <ReceiptLongIcon fontSize="small" />,
        section: 'activity',
      },
      {
        to: '/produits',
        label: 'Produits',
        description: 'Catalogue et tarifs',
        icon: <Inventory2Icon fontSize="small" />,
        section: 'activity',
      },
      {
        to: CREANCES_PATH,
        label: 'Créances',
        description: 'Factures impayées par vos clients',
        icon: <CreditScoreIcon fontSize="small" />,
        section: 'encours',
      },
      {
        to: DETTES_INBOX,
        label: 'Dettes',
        description: 'Montants dus à vos créanciers',
        icon: <AccountBalanceWalletIcon fontSize="small" />,
        section: 'encours',
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    overview: 'Obligations fiscales et comptabilité.',
    overviewCta: { label: 'Comptabilité', to: '/comptabilite' },
    featured: {
      title: 'Comptabilité',
      description: 'Grand livre, rapports et suivi comptable.',
      to: '/comptabilite',
      cta: 'Ouvrir',
      icon: <AccountBalanceIcon />,
      accent: 'emerald',
    },
    items: [
      {
        to: '/taxes',
        label: 'Taxes',
        description: 'TVA et obligations fiscales',
        icon: <LocalAtmIcon fontSize="small" />,
      },
      {
        to: '/abonnements',
        label: 'Abonnements',
        description: 'Revenus récurrents',
        icon: <AutorenewIcon fontSize="small" />,
      },
      {
        to: '/declarations',
        label: 'Déclarations',
        description: 'Déclarations légales',
        icon: <GavelIcon fontSize="small" />,
      },
      {
        to: '/comptabilite',
        label: 'Comptabilité',
        description: 'Grand livre et rapports',
        icon: <AccountBalanceIcon fontSize="small" />,
      },
    ],
  },
]

/**
 * Mega-menu Paramètres filtré selon le plan (API Pro, quotas Free).
 *
 * @param filter - Filtres plan (API publique, plan Free)
 */
export function createNavSettingsGroup(filter: SettingsNavFilter = {}): NavGroup {
  return {
    id: 'parametres',
    layout: 'compact',
    label: 'Paramètres',
    overview: 'Compte, entreprise, facturation électronique et préférences.',
    overviewCta: { label: 'Vue d’ensemble', to: '/parametres' },
    featured: {
      title: 'Profil entreprise',
      description: 'SIRET, adresse et coordonnées de facturation.',
      to: '/parametres/entreprise',
      cta: 'Configurer',
      secondaryCta: { label: 'Abonnement', to: '/parametres/abonnement' },
      icon: <BusinessIcon />,
      accent: 'amber',
    },
    items: filterSettingsNavItems(settingsNavItems, filter)
      .filter((item) => item.to !== '/parametres')
      .map((item) => ({
        to: item.to,
        label: item.label,
        description: item.description,
        icon: item.icon,
        section: item.section,
        badge: item.requiresPro ? 'Pro' : undefined,
      })),
  }
}

/** Groupe paramètres sans filtre plan (tests / fallback). */
export const navSettingsGroup: NavGroup = createNavSettingsGroup({
  publicApiEnabled: true,
  isFreePlan: true,
})

export const navSettings: NavItem = {
  to: '/parametres',
  label: 'Paramètres',
  description: 'Compte, entreprise et préférences',
  icon: <ManageAccountsIcon fontSize="small" />,
}

export const allNavItems: NavItem[] = [
  navDashboard,
  ...navGroups.flatMap((g) => g.items),
  navSettings,
]

export function isNavActive(pathname: string, to: string): boolean {
  if (to === '/dashboard') return pathname === '/dashboard' || pathname === '/'
  if (to === '/parametres') return pathname === '/parametres' || pathname.startsWith('/parametres/')
  if (to.startsWith('/factures')) return pathname.startsWith('/factures')
  if (to.startsWith('/devis')) return pathname.startsWith('/devis')
  if (to.startsWith('/clients')) return pathname.startsWith('/clients')
  if (to === CREANCES_PATH) {
    return pathname === CREANCES_PATH || pathname.startsWith(`${CREANCES_PATH}/`)
  }
  if (to.startsWith('/dettes')) return pathname.startsWith('/dettes')
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function isGroupActive(pathname: string, group: NavGroup): boolean {
  if (group.id === 'parametres') {
    return pathname === '/parametres' || pathname.startsWith('/parametres/')
  }
  return group.items.some((item) => isNavActive(pathname, item.to))
}
