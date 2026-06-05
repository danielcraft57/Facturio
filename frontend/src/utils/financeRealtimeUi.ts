import type { FinanceRealtimeEvent, FinanceRealtimeDetail, RealtimeHighlightTone } from '../types/realtime'

export function actionToHighlightTone(action: FinanceRealtimeEvent['action']): RealtimeHighlightTone {
  switch (action) {
    case 'created':
      return 'created'
    case 'sent':
      return 'sent'
    case 'paid':
      return 'paid'
    case 'deleted':
      return 'deleted'
    default:
      return 'updated'
  }
}

export function buildRealtimeDetail(event: FinanceRealtimeEvent): FinanceRealtimeDetail | null {
  if (!event.resource || !event.action) return null
  return {
    resource: event.resource,
    action: event.action,
    id: event.id,
    number: event.number,
    status: event.status,
    tone: actionToHighlightTone(event.action),
  }
}

const INVOICE_LABELS: Record<string, { title: string; message: (n: string) => string; type: 'success' | 'info' | 'warning' | 'error' }> = {
  created: {
    title: 'Nouvelle facture',
    message: (n) => `${n} a été créée.`,
    type: 'success',
  },
  sent: {
    title: 'Facture envoyée',
    message: (n) => `${n} a été envoyée par email.`,
    type: 'info',
  },
  paid: {
    title: 'Facture payée',
    message: (n) => `${n} est marquée comme payée.`,
    type: 'success',
  },
  updated: {
    title: 'Facture mise à jour',
    message: (n) => `${n} a été modifiée.`,
    type: 'info',
  },
  deleted: {
    title: 'Facture supprimée',
    message: (n) => `${n} a été supprimée.`,
    type: 'warning',
  },
}

const QUOTE_LABELS: Record<string, { title: string; message: (n: string) => string; type: 'success' | 'info' | 'warning' | 'error' }> = {
  created: {
    title: 'Nouveau devis',
    message: (n) => `${n} a été créé.`,
    type: 'success',
  },
  sent: {
    title: 'Devis envoyé',
    message: (n) => `${n} a été envoyé par email.`,
    type: 'info',
  },
  paid: {
    title: 'Devis accepté',
    message: (n) => `${n} a été accepté.`,
    type: 'success',
  },
  updated: {
    title: 'Devis mis à jour',
    message: (n) => `${n} a été modifié.`,
    type: 'info',
  },
  deleted: {
    title: 'Devis supprimé',
    message: (n) => `${n} a été supprimé.`,
    type: 'warning',
  },
}

const PAYABLE_EMAIL_LABELS: Record<string, { title: string; message: (n: string) => string; type: 'success' | 'info' | 'warning' | 'error' }> = {
  EMAIL_SENT: {
    title: 'Dette envoyée',
    message: (n) => `Reconnaissance de dette « ${n} » envoyée par email.`,
    type: 'info',
  },
  EMAIL_OPENED: {
    title: 'Email dette ouvert',
    message: (n) => `Le créancier a ouvert l’email pour « ${n} ».`,
    type: 'info',
  },
  EMAIL_CLICKED: {
    title: 'Lien dette cliqué',
    message: (n) => `Le créancier a cliqué le lien pour « ${n} ».`,
    type: 'success',
  },
}

export function buildNotificationFromRealtime(detail: FinanceRealtimeDetail) {
  const label = detail.number || (detail.id != null ? `#${detail.id}` : 'Document')

  if (detail.resource === 'payables' && detail.status) {
    const cfg = PAYABLE_EMAIL_LABELS[detail.status] ?? {
      title: 'Dette mise à jour',
      message: (n: string) => `${n} a été mise à jour.`,
      type: 'info' as const,
    }
    return {
      type: cfg.type,
      title: cfg.title,
      message: cfg.message(label),
      category: 'invoice' as const,
      href: '/dettes/inbox',
    }
  }

  const map = detail.resource === 'invoices' ? INVOICE_LABELS : QUOTE_LABELS
  const cfg = map[detail.action] ?? map.updated
  const href =
    detail.id != null
      ? detail.resource === 'invoices'
        ? `/factures/${detail.id}`
        : detail.resource === 'payables'
          ? '/dettes/inbox'
          : `/devis`
      : undefined

  return {
    type: cfg.type,
    title: cfg.title,
    message: cfg.message(label),
    category:
      detail.resource === 'invoices'
        ? ('invoice' as const)
        : detail.resource === 'quotes'
          ? ('quote' as const)
          : ('invoice' as const),
    href,
  }
}

export const HIGHLIGHT_DURATION_MS: Record<RealtimeHighlightTone, number> = {
  created: 5000,
  sent: 4000,
  paid: 4500,
  updated: 3500,
  deleted: 3000,
}
