import type { SvgIconComponent } from '@mui/icons-material'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import LinkIcon from '@mui/icons-material/Link'

/** Aligné sur server/src/stripe/invoice-stripe-payment-methods.ts */
export type InvoiceStripePaymentMethodId =
  | 'card'
  | 'paypal'
  | 'bancontact'
  | 'klarna'
  | 'amazon_pay'
  | 'eps'
  | 'mb_way'
  | 'ideal'
  | 'link'

export type InvoiceStripePaymentMethodOption = {
  id: InvoiceStripePaymentMethodId
  label: string
  shortLabel: string
  /** Couleur d’accent (marque) */
  brandColor: string
  /** Fond de la vignette */
  tileBg: string
  /** Slug simple-icons (CDN) — optionnel */
  iconSlug?: string
  /** Icône MUI de repli */
  FallbackIcon: SvgIconComponent
}

export const INVOICE_STRIPE_PAYMENT_METHOD_OPTIONS: InvoiceStripePaymentMethodOption[] = [
  {
    id: 'card',
    label: 'Carte bancaire (Visa, Mastercard…)',
    shortLabel: 'Carte',
    brandColor: '#1A1F71',
    tileBg: '#EEF2FF',
    iconSlug: 'visa',
    FallbackIcon: CreditCardIcon,
  },
  {
    id: 'paypal',
    label: 'PayPal',
    shortLabel: 'PayPal',
    brandColor: '#003087',
    tileBg: '#E8F1FA',
    iconSlug: 'paypal',
    FallbackIcon: AccountBalanceWalletIcon,
  },
  {
    id: 'bancontact',
    label: 'Bancontact',
    shortLabel: 'Bancontact',
    brandColor: '#005498',
    tileBg: '#E6F2FA',
    iconSlug: 'bancontact',
    FallbackIcon: CreditCardIcon,
  },
  {
    id: 'klarna',
    label: 'Klarna',
    shortLabel: 'Klarna',
    brandColor: '#0A0B09',
    tileBg: '#FFF0F5',
    iconSlug: 'klarna',
    FallbackIcon: AccountBalanceWalletIcon,
  },
  {
    id: 'amazon_pay',
    label: 'Amazon Pay',
    shortLabel: 'Amazon Pay',
    brandColor: '#FF9900',
    tileBg: '#FFF8E6',
    iconSlug: 'amazon',
    FallbackIcon: AccountBalanceWalletIcon,
  },
  {
    id: 'eps',
    label: 'EPS',
    shortLabel: 'EPS',
    brandColor: '#C8036F',
    tileBg: '#FCEAF4',
    iconSlug: 'eps',
    FallbackIcon: AccountBalanceWalletIcon,
  },
  {
    id: 'mb_way',
    label: 'MB WAY',
    shortLabel: 'MB WAY',
    brandColor: '#E1271B',
    tileBg: '#FFEBEA',
    iconSlug: 'mbway',
    FallbackIcon: AccountBalanceWalletIcon,
  },
  {
    id: 'ideal',
    label: 'iDEAL',
    shortLabel: 'iDEAL',
    brandColor: '#CC0066',
    tileBg: '#FCE6F2',
    iconSlug: 'ideal',
    FallbackIcon: AccountBalanceWalletIcon,
  },
  {
    id: 'link',
    label: 'Link',
    shortLabel: 'Link',
    brandColor: '#00D66F',
    tileBg: '#E8FBF2',
    iconSlug: 'stripe',
    FallbackIcon: LinkIcon,
  },
]

/** Logos simple-icons (SVG) — usage interne Facturio, pas d’asset local requis. */
export function paymentMethodIconUrl(slug: string): string {
  return `https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons/${slug}.svg`
}
