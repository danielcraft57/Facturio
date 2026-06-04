import type { RealtimeEvent } from '../types/realtime'

export function formatRealtimeEventLabel(event: RealtimeEvent): string {
  const doc = event.resource === 'quotes' ? 'Devis' : 'Facture'
  const num = event.number ? ` ${event.number}` : ''
  const status = event.status?.toUpperCase()
  const action = event.action?.toUpperCase()

  if (status === 'EMAIL_OPENED') return `${doc}${num} consulté par le client`
  if (status === 'EMAIL_CLICKED') return `${doc}${num} cliqué par le client`
  if (status === 'PAID' || action === 'PAID') return `${doc}${num} payé`
  if (status === 'ACCEPTED') return `${doc}${num} accepté`
  if (status === 'REJECTED') return `${doc}${num} refusé`
  if (action === 'SENT') return `${doc}${num} envoyé`
  if (action === 'UPDATED') return `${doc}${num} mis à jour`
  return `${doc}${num} (${action?.toLowerCase() ?? 'événement'})`
}
