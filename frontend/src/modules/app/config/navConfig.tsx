import type { ReactNode } from 'react'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import DescriptionIcon from '@mui/icons-material/Description'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import SearchIcon from '@mui/icons-material/Search'
import LocalAtmIcon from '@mui/icons-material/LocalAtm'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import GavelIcon from '@mui/icons-material/Gavel'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

export type NavItem = {
  to: string
  label: string
  description?: string
  icon: ReactNode
  badge?: string
}

export type NavFeatured = {
  title: string
  description: string
  to: string
  cta: string
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
  to: '/',
  label: 'Tableau de bord',
  description: "Vue d'ensemble & indicateurs",
  icon: <DashboardIcon fontSize="small" />,
}

export const navGroups: NavGroup[] = [
  {
    id: 'commercial',
    label: 'Commercial',
    overview: 'Clients, devis, factures et catalogue — le cœur de votre activité.',
    overviewCta: { label: 'Voir les factures', to: '/factures' },
    featured: {
      title: 'Créer une facture',
      description: 'Émettez et envoyez une facture en quelques clics, avec relance intégrée.',
      to: '/factures',
      cta: 'Nouvelle facture',
      icon: <AddCircleOutlineIcon />,
      accent: 'navy',
    },
    items: [
      {
        to: '/clients',
        label: 'Clients',
        description: 'Carnet, contacts et historique',
        icon: <PeopleIcon fontSize="small" />,
      },
      {
        to: '/devis',
        label: 'Devis',
        description: 'Propositions commerciales',
        icon: <DescriptionIcon fontSize="small" />,
      },
      {
        to: '/factures',
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
      {
        to: '/prospection',
        label: 'Prospection',
        description: 'Pipeline et prospects',
        icon: <SearchIcon fontSize="small" />,
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    overview: 'Fiscalité, abonnements, déclarations et suivi comptable.',
    overviewCta: { label: 'Ouvrir la comptabilité', to: '/comptabilite' },
    featured: {
      title: 'Suivi financier',
      description: 'Consolidez taxes, déclarations et indicateurs en un seul espace.',
      to: '/comptabilite',
      cta: 'Tableau finance',
      icon: <TrendingUpIcon />,
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
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function isGroupActive(pathname: string, group: NavGroup): boolean {
  return group.items.some((item) => isNavActive(pathname, item.to))
}
