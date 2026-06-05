export type RealtimeResource = 'invoices' | 'quotes'
export type RealtimeAction = 'created' | 'updated' | 'deleted' | 'sent' | 'paid'

export interface RealtimeEvent {
  type?: 'connected' | 'heartbeat'
  resource?: RealtimeResource
  action?: RealtimeAction
  id?: string
  number?: string
  status?: string
  at?: string
}
