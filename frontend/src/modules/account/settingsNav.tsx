import type { ReactNode } from 'react'
import BusinessIcon from '@mui/icons-material/Business'
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import PaymentIcon from '@mui/icons-material/Payment'
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip'
import StorageIcon from '@mui/icons-material/Storage'
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize'

export type SettingsNavItem = {
  to: string
  label: string
  description: string
  icon: ReactNode
}

export const settingsNavItems: SettingsNavItem[] = [
  {
    to: '/parametres',
    label: 'Vue d’ensemble',
    description: 'Accès rapide à tous les réglages',
    icon: <DashboardCustomizeIcon fontSize="small" />,
  },
  {
    to: '/parametres/entreprise',
    label: 'Entreprise',
    description: 'Identité, SIRET, adresse, contact',
    icon: <BusinessIcon fontSize="small" />,
  },
  {
    to: '/parametres/abonnement',
    label: 'Abonnement',
    description: 'Plan Free, Pro, quotas',
    icon: <CardMembershipIcon fontSize="small" />,
  },
  {
    to: '/parametres/facturation-electronique',
    label: 'Réforme 2026',
    description: 'Conformité e-facture & Factur-X',
    icon: <VerifiedUserIcon fontSize="small" />,
  },
  {
    to: '/parametres/paiements',
    label: 'Paiements',
    description: 'Stripe sur vos factures',
    icon: <PaymentIcon fontSize="small" />,
  },
  {
    to: '/parametres/confidentialite',
    label: 'Confidentialité',
    description: 'Mentions sur pages clients',
    icon: <PrivacyTipIcon fontSize="small" />,
  },
  {
    to: '/parametres/donnees',
    label: 'Mes données',
    description: 'Export RGPD & suppression',
    icon: <StorageIcon fontSize="small" />,
  },
]

export function isSettingsPathActive(pathname: string, to: string): boolean {
  if (to === '/parametres') return pathname === '/parametres'
  return pathname === to || pathname.startsWith(`${to}/`)
}
