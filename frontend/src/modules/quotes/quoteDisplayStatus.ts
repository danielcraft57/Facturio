import type { EmailEngagement } from '../documents/documentEmailEngagement'
import type { QuoteStatus } from '../../types/quote'

export type QuoteDisplayStatus = {
  label: string
  color: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info'
}

export type QuoteStatusSource = {
  status: QuoteStatus
  emailSent?: boolean
  emailOpened?: boolean
  emailClicked?: boolean
  emailClickAction?: string | null
  emailEngagement?: EmailEngagement | null
}

/**
 * Statut affiché dans l’UI : parcours email puis décision client.
 * Brouillon → Envoyé → Vu → Cliqué → Accepté / Refusé (ou Expiré).
 */
export function resolveQuoteDisplayStatus(quote: QuoteStatusSource): QuoteDisplayStatus {
  if (quote.status === 'ACCEPTED') {
    return { label: 'Accepté', color: 'success' }
  }
  if (quote.status === 'REJECTED') {
    return { label: 'Refusé', color: 'error' }
  }
  if (quote.status === 'EXPIRED') {
    return { label: 'Expiré', color: 'warning' }
  }
  if (quote.status === 'DRAFT') {
    return { label: 'Brouillon', color: 'default' }
  }

  const eng = quote.emailEngagement
  const emailSent = eng?.emailSent ?? quote.emailSent
  const opened = eng?.opened ?? quote.emailOpened
  const clicked = eng?.clicked ?? quote.emailClicked

  if (clicked) {
    return { label: 'Cliqué', color: 'info' }
  }
  if (opened) {
    return { label: 'Vu', color: 'info' }
  }
  if (emailSent || quote.status === 'SENT') {
    return { label: 'Envoyé', color: 'primary' }
  }

  return { label: 'Envoyé', color: 'primary' }
}
