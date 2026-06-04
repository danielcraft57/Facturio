import { formatRealtimeEventLabel } from '../realtimeEventLabel'
import type { RealtimeEvent } from '../../types/realtime'

function event(partial: Partial<RealtimeEvent>): RealtimeEvent {
  return {
    type: 'update',
    resource: 'invoices',
    action: 'UPDATED',
    ...partial,
  } as RealtimeEvent
}

describe('formatRealtimeEventLabel', () => {
  it('formate un paiement facture', () => {
    expect(
      formatRealtimeEventLabel(
        event({ resource: 'invoices', number: 'F-12', status: 'PAID' }),
      ),
    ).toBe('Facture F-12 payé')
  })

  it('formate un devis accepté', () => {
    expect(
      formatRealtimeEventLabel(
        event({ resource: 'quotes', number: 'D-3', status: 'ACCEPTED' }),
      ),
    ).toBe('Devis D-3 accepté')
  })

  it('formate une ouverture email', () => {
    expect(
      formatRealtimeEventLabel(
        event({ resource: 'invoices', number: 'F-1', status: 'EMAIL_OPENED' }),
      ),
    ).toBe('Facture F-1 consulté par le client')
  })

  it('retombe sur une étiquette générique', () => {
    expect(formatRealtimeEventLabel(event({ action: 'CREATED', number: 'F-9' }))).toBe(
      'Facture F-9 (created)',
    )
  })
})
