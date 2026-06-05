import type { Invoice } from '../services/invoices'
import type { PayableDebtRow } from '../services/payables'
import type { Quote, QuoteStatus } from '../types/quote'
import type { FinanceRealtimeDetail } from '../types/realtime'

function matchesDetailId(itemId: string | number, detail: FinanceRealtimeDetail): boolean {
  return detail.id != null && String(itemId) === String(detail.id)
}

function engagementFlags(status?: string): Partial<{
  emailSent: boolean
  emailOpened: boolean
  emailClicked: boolean
}> {
  const s = status?.toUpperCase()
  if (s === 'EMAIL_OPENED') return { emailSent: true, emailOpened: true }
  if (s === 'EMAIL_CLICKED') return { emailSent: true, emailOpened: true, emailClicked: true }
  return {}
}

export function patchQuoteFromRealtimeDetail(
  quote: Quote,
  detail: FinanceRealtimeDetail,
): Quote {
  if (!matchesDetailId(quote.id, detail)) return quote

  const flags = engagementFlags(detail.status)
  if (Object.keys(flags).length > 0) {
    return { ...quote, ...flags }
  }

  if (detail.action === 'sent') {
    return { ...quote, status: 'SENT', emailSent: true }
  }

  if (detail.action === 'paid') {
    return { ...quote, status: 'ACCEPTED' }
  }

  const status = detail.status?.toUpperCase()
  if (status === 'ACCEPTED') return { ...quote, status: 'ACCEPTED' }
  if (status === 'REJECTED') return { ...quote, status: 'REJECTED' }
  if (status === 'EXPIRED') return { ...quote, status: 'EXPIRED' }

  if (detail.action === 'updated' && status) {
    const known: QuoteStatus[] = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']
    if (known.includes(status as QuoteStatus)) {
      return { ...quote, status: status as QuoteStatus }
    }
  }

  return quote
}

export function patchInvoiceFromRealtimeDetail(
  invoice: Invoice,
  detail: FinanceRealtimeDetail,
): Invoice {
  if (!matchesDetailId(invoice.id, detail)) return invoice

  const flags = engagementFlags(detail.status)
  if (Object.keys(flags).length > 0) {
    return { ...invoice, ...flags }
  }

  if (detail.action === 'sent') {
    return {
      ...invoice,
      status: invoice.status === 'draft' ? 'sent' : invoice.status,
      emailSent: true,
      sentAt: invoice.sentAt ?? new Date().toISOString(),
    }
  }

  if (detail.action === 'paid') {
    return { ...invoice, status: 'paid', paidAt: invoice.paidAt ?? new Date().toISOString() }
  }

  const status = detail.status?.toLowerCase()
  if (detail.action === 'updated' && status) {
    const known: Invoice['status'][] = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
    if (known.includes(status as Invoice['status'])) {
      return { ...invoice, status: status as Invoice['status'] }
    }
  }

  return invoice
}

export function patchPayableDebtFromRealtimeDetail(
  debt: PayableDebtRow,
  detail: FinanceRealtimeDetail,
): PayableDebtRow {
  if (!matchesDetailId(debt.id, detail)) return debt

  const flags = engagementFlags(detail.status)
  if (Object.keys(flags).length > 0) {
    return {
      ...debt,
      emailSent: flags.emailSent ?? debt.emailSent,
      emailOpened: flags.emailOpened ?? debt.emailOpened,
      emailClicked: flags.emailClicked ?? debt.emailClicked,
      emailEngagement: {
        ...(debt.emailEngagement ?? {}),
        emailSent: flags.emailSent ?? debt.emailEngagement?.emailSent,
        opened: flags.emailOpened ?? debt.emailEngagement?.opened,
        clicked: flags.emailClicked ?? debt.emailEngagement?.clicked,
      },
    }
  }

  return debt
}

export function patchQuoteAfterSend(quote: Quote): Quote {
  return { ...quote, status: 'SENT', emailSent: true }
}

export function patchQuoteWithInvoiceId(quote: Quote, invoiceId: string): Quote {
  return { ...quote, invoiceId }
}

export function patchPayableDebtAfterSend(debt: PayableDebtRow): PayableDebtRow {
  return {
    ...debt,
    emailSent: true,
    emailEngagement: { ...(debt.emailEngagement ?? {}), emailSent: true },
  }
}

export function patchPayableDebtAfterCancel(debt: PayableDebtRow): PayableDebtRow {
  return { ...debt, status: 'CANCELLED' }
}
