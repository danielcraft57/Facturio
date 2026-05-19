import type { ReactNode } from 'react'
import BusinessIcon from '@mui/icons-material/Business'
import CardMembershipIcon from '@mui/icons-material/CardMembership'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import PaymentIcon from '@mui/icons-material/Payment'
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip'
import StorageIcon from '@mui/icons-material/Storage'
import SettingsIcon from '@mui/icons-material/Settings'

export type UserMenuLink = {
  to: string
  label: string
  description?: string
  icon?: ReactNode
  external?: boolean
}

/** Liens du menu profil (application — pas la page marketing RGPD). */
export const userMenuLinks: UserMenuLink[] = [
  { to: '/parametres', label: 'Vue d’ensemble', description: 'Tous les réglages', icon: <SettingsIcon fontSize="small" /> },
  { to: '/parametres/entreprise', label: 'Entreprise', description: 'Identité, SIRET, adresse', icon: <BusinessIcon fontSize="small" /> },
  { to: '/parametres/abonnement', label: 'Abonnement', description: 'Plan et quotas', icon: <CardMembershipIcon fontSize="small" /> },
  {
    to: '/parametres/facturation-electronique',
    label: 'Réforme 2026',
    description: 'E-facture & conformité',
    icon: <VerifiedUserIcon fontSize="small" />,
  },
  { to: '/parametres/paiements', label: 'Paiements Stripe', description: 'Encaissement factures', icon: <PaymentIcon fontSize="small" /> },
  {
    to: '/parametres/confidentialite',
    label: 'Confidentialité',
    description: 'Pages publiques clients',
    icon: <PrivacyTipIcon fontSize="small" />,
  },
  { to: '/parametres/donnees', label: 'Mes données', description: 'Export & suppression', icon: <StorageIcon fontSize="small" /> },
]
