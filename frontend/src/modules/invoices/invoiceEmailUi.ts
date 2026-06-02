import type { Invoice } from '../../services/invoices'

export function wasInvoiceEmailed(
  invoice: Pick<Invoice, 'sentAt' | 'emailSent' | 'emailEngagement'>,
): boolean {
  if (invoice.emailEngagement != null) return Boolean(invoice.emailEngagement.emailSent)
  if (invoice.emailSent != null) return invoice.emailSent
  return false
}

export function formatInvoiceSentAt(sentAt?: string): string {
  if (!sentAt) return ''
  const d = new Date(sentAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function invoiceEmailSentTitle(invoice: Pick<Invoice, 'sentAt'>): string {
  const when = formatInvoiceSentAt(invoice.sentAt)
  return when ? `Email envoyé le ${when}` : 'Email envoyé — renvoyer'
}
