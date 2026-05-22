export type RealtimeResource = 'invoices' | 'quotes'

export type RealtimeAction = 'created' | 'updated' | 'deleted' | 'sent' | 'paid'

export type RealtimeHighlightTone = 'created' | 'updated' | 'sent' | 'paid' | 'deleted'

export type FinanceRealtimeEvent = {
  type?: 'connected' | 'heartbeat'
  resource?: RealtimeResource
  action?: RealtimeAction
  id?: number
  number?: string
  status?: string
  at?: string
}

export type FinanceRealtimeDetail = {
  resource: RealtimeResource
  action: RealtimeAction
  id?: number
  number?: string
  status?: string
  tone: RealtimeHighlightTone
}
