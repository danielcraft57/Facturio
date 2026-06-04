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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CreditScoreIcon from '@mui/icons-material/CreditScore'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'

export type NavItem = {
  to: string
  label: string
  description?: string
  icon: ReactNode
  badge?: string
  /** Mise en avant visuelle (ex. créances / dettes). */
  emphasis?: boolean
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
    overview: 'Vente : clients, devis, factures et catalogue.',
    overviewCta: { label: 'Factures', to: '/factures/inbox' },
    featured: {
      title: 'Créer une facture',
      description: 'Émission rapide avec relances intégrées.',
      to: '/factures/inbox',
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
      },
      {
        to: '/devis/inbox',
        label: 'Devis',
        description: 'Propositions commerciales',
        icon: <DescriptionIcon fontSize="small" />,
      },
      {
        to: '/factures/inbox',
        label: 'Factures',
        description: 'Émission, envoi et relances',
        icon: <ReceiptLongIcon fontSize="small" />,
        badge: 'Relances',
      },
      {
        to: '/produits',
        label: 'Produits',
        description: 'Catalogue et tarifs',
        icon: <Inventory2Icon fontSize="small" />,
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    overview: 'Encours, obligations fiscales et comptabilité.',
    overviewCta: { label: 'Créances', to: '/finance/creances' },
    featured: {
      title: 'Encours',
      description: 'À recevoir des clients et à rembourser aux créanciers.',
      to: '/finance/creances',
      cta: 'Créances',
      secondaryCta: { label: 'Dettes', to: '/finance/dettes' },
      icon: <CreditScoreIcon />,
      accent: 'emerald',
    },
    items: [
      {
        to: '/finance/creances',
        label: 'Créances',
        description: 'Factures impayées par vos clients',
        icon: <CreditScoreIcon fontSize="small" />,
      },
      {
        to: '/finance/dettes',
        label: 'Dettes',
        description: 'Montants dus à vos créanciers',
        icon: <AccountBalanceWalletIcon fontSize="small" />,
      },
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
  if (to === '/finance/creances' || to === '/finance/dettes') {
    return pathname === to || pathname.startsWith(`${to}/`)
  }
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function isGroupActive(pathname: string, group: NavGroup): boolean {
  return group.items.some((item) => isNavActive(pathname, item.to))
}
