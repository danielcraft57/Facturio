import type { EmailEngagement } from '../documents/documentEmailEngagement'
import type { Invoice } from '../../services/invoices'
import type { InvoiceInstallmentSummary } from '../../utils/invoiceInstallmentLabels'

export type InvoiceDisplayStatus = {
  label: string
  color: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info'
}

export type InvoiceStatusSource = Pick<
  Invoice,
  'status' | 'emailSent' | 'emailOpened' | 'emailClicked' | 'emailClickAction' | 'total' | 'balance'
> & {
  emailEngagement?: EmailEngagement | null
  installmentSummary?: InvoiceInstallmentSummary | null
}

/**
 * Statut affiché : parcours email puis règlement.
 * Brouillon → Envoyée → Vu → Cliqué → Partiellement payée → Payée / En retard / Annulée.
 */
export function resolveInvoiceDisplayStatus(invoice: InvoiceStatusSource): InvoiceDisplayStatus {
  if (invoice.status === 'paid') {
    return { label: 'Payée', color: 'success' }
  }
  if (invoice.status === 'cancelled') {
    return { label: 'Annulée', color: 'default' }
  }
  if (invoice.status === 'overdue') {
    return { label: 'En retard', color: 'error' }
  }
  if (invoice.status === 'draft') {
    return { label: 'Brouillon', color: 'warning' }
  }

  const summary = invoice.installmentSummary
  if (
    summary?.hasPlan &&
    summary.paidCount > 0 &&
    summary.paidCount < summary.totalCount
  ) {
    return {
      label: `${summary.paidCount}/${summary.totalCount} payée${summary.paidCount > 1 ? 's' : ''}`,
      color: 'success',
    }
  }

  const balance = invoice.balance
  const total = invoice.total
  if (
    balance != null &&
    total != null &&
    balance > 0.01 &&
    balance < total - 0.01
  ) {
    return { label: 'Partiellement payée', color: 'warning' }
  }

  const eng = invoice.emailEngagement
  const emailSent = eng?.emailSent ?? invoice.emailSent
  const opened = eng?.opened ?? invoice.emailOpened
  const clicked = eng?.clicked ?? invoice.emailClicked

  if (clicked) {
    return { label: 'Cliqué', color: 'info' }
  }
  if (opened) {
    return { label: 'Vu', color: 'info' }
  }
  if (emailSent || invoice.status === 'sent') {
    return { label: 'Envoyée', color: 'primary' }
  }

  return { label: 'Envoyée', color: 'primary' }
}
