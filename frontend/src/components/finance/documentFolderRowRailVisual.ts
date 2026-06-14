import type { SvgIconComponent } from '@mui/icons-material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ScheduleIcon from '@mui/icons-material/Schedule'
import DescriptionIcon from '@mui/icons-material/Description'
import SendIcon from '@mui/icons-material/Send'
import VisibilityIcon from '@mui/icons-material/Visibility'
import TouchAppIcon from '@mui/icons-material/TouchApp'
import ErrorIcon from '@mui/icons-material/Error'
import CancelIcon from '@mui/icons-material/Cancel'
import ThumbUpIcon from '@mui/icons-material/ThumbUp'
import ThumbDownIcon from '@mui/icons-material/ThumbDown'
import EventBusyIcon from '@mui/icons-material/EventBusy'
import PaymentsIcon from '@mui/icons-material/Payments'
import type { Invoice } from '../../services/invoices'
import type { PayableDebtRow } from '../../services/payables'
import { resolveInvoiceDisplayStatus } from '../../modules/invoices/invoiceDisplayStatus'
import { resolvePayableDebtDisplayStatus } from '../../modules/finance/payableDebtDisplayStatus'
import type { QuoteStatusSource } from '../../modules/quotes/quoteDisplayStatus'
import { resolveQuoteDisplayStatus } from '../../modules/quotes/quoteDisplayStatus'

export type DocumentFolderRailVisual = {
  accent: string
  accentMuted: string
  Icon: SvgIconComponent
  iconTitle: string
}

/** Palette pédagogique : une teinte par étape du parcours document. */
function railFromStatusLabel(label: string): DocumentFolderRailVisual {
  switch (label) {
    case 'Brouillon':
      return {
        accent: '#94a3b8',
        accentMuted: 'rgba(148, 163, 184, 0.18)',
        Icon: DescriptionIcon,
        iconTitle: 'Brouillon',
      }
    case 'Envoyé':
    case 'Envoyée':
      return {
        accent: '#2563eb',
        accentMuted: 'rgba(37, 99, 235, 0.14)',
        Icon: SendIcon,
        iconTitle: label,
      }
    case 'Vu':
      return {
        accent: '#4f46e5',
        accentMuted: 'rgba(79, 70, 229, 0.14)',
        Icon: VisibilityIcon,
        iconTitle: 'Vu',
      }
    case 'Cliqué':
      return {
        accent: '#7c3aed',
        accentMuted: 'rgba(124, 58, 237, 0.14)',
        Icon: TouchAppIcon,
        iconTitle: 'Cliqué',
      }
    case 'Accepté':
      return {
        accent: '#15803d',
        accentMuted: 'rgba(21, 128, 61, 0.14)',
        Icon: ThumbUpIcon,
        iconTitle: 'Accepté',
      }
    case 'Refusé':
      return {
        accent: '#dc2626',
        accentMuted: 'rgba(220, 38, 38, 0.14)',
        Icon: ThumbDownIcon,
        iconTitle: 'Refusé',
      }
    case 'Expiré':
      return {
        accent: '#ea580c',
        accentMuted: 'rgba(234, 88, 12, 0.14)',
        Icon: EventBusyIcon,
        iconTitle: 'Expiré',
      }
    case 'Payée':
      return {
        accent: '#16a34a',
        accentMuted: 'rgba(22, 163, 74, 0.14)',
        Icon: CheckCircleIcon,
        iconTitle: 'Payée',
      }
    case 'Soldée':
      return {
        accent: '#16a34a',
        accentMuted: 'rgba(22, 163, 74, 0.14)',
        Icon: CheckCircleIcon,
        iconTitle: 'Soldée',
      }
    case 'En retard':
      return {
        accent: '#dc2626',
        accentMuted: 'rgba(220, 38, 38, 0.14)',
        Icon: ErrorIcon,
        iconTitle: 'En retard',
      }
    case 'Annulée':
      return {
        accent: '#64748b',
        accentMuted: 'rgba(100, 116, 139, 0.14)',
        Icon: CancelIcon,
        iconTitle: 'Annulée',
      }
    case 'Partiel':
      return {
        accent: '#ea580c',
        accentMuted: 'rgba(234, 88, 12, 0.14)',
        Icon: PaymentsIcon,
        iconTitle: 'Partiel',
      }
    case 'À régler':
      return {
        accent: '#d97706',
        accentMuted: 'rgba(217, 119, 6, 0.14)',
        Icon: DescriptionIcon,
        iconTitle: 'À régler',
      }
    case 'Reporté':
      return {
        accent: '#64748b',
        accentMuted: 'rgba(100, 116, 139, 0.12)',
        Icon: ScheduleIcon,
        iconTitle: 'Reporté',
      }
    default:
      return {
        accent: '#0f172a',
        accentMuted: 'rgba(15, 23, 42, 0.08)',
        Icon: DescriptionIcon,
        iconTitle: label,
      }
  }
}

function isSnoozed(snoozedUntil?: string | null): boolean {
  return !!snoozedUntil && new Date(snoozedUntil) > new Date()
}

function withSnoozeOverlay(
  visual: DocumentFolderRailVisual,
  snoozedUntil?: string | null,
): DocumentFolderRailVisual {
  if (!isSnoozed(snoozedUntil)) return visual
  return {
    ...railFromStatusLabel('Reporté'),
    iconTitle: `${visual.iconTitle} · reporté`,
  }
}

export function resolveInvoiceRailVisual(
  invoice: Pick<
    Invoice,
    | 'starred'
    | 'important'
    | 'seenAt'
    | 'snoozedUntil'
    | 'status'
    | 'emailSent'
    | 'emailOpened'
    | 'emailClicked'
    | 'emailClickAction'
    | 'emailEngagement'
    | 'total'
    | 'balance'
  >,
): DocumentFolderRailVisual {
  const display = resolveInvoiceDisplayStatus(invoice)
  return withSnoozeOverlay(railFromStatusLabel(display.label), invoice.snoozedUntil)
}

export function resolvePayableDebtRailVisual(debt: PayableDebtRow): DocumentFolderRailVisual {
  const display = resolvePayableDebtDisplayStatus(debt)
  return withSnoozeOverlay(railFromStatusLabel(display.label), debt.snoozedUntil)
}

export function resolveQuoteRailVisual(quote: QuoteStatusSource & {
  snoozedUntil?: string | null
}): DocumentFolderRailVisual {
  const display = resolveQuoteDisplayStatus(quote)
  return withSnoozeOverlay(railFromStatusLabel(display.label), quote.snoozedUntil)
}
