import { resolveApiBaseUrl } from '../utils/resolveApiBaseUrl'
import type { FinanceRealtimeEvent } from '../types/realtime'

export const FINANCE_REALTIME_EVENT = 'facturio:finance-realtime'

let eventSource: EventSource | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

function buildStreamUrl(): string | null {
  const token = localStorage.getItem('auth_token')?.trim()
  if (!token) return null
  const base = resolveApiBaseUrl().replace(/\/$/, '')
  const prefix = base.startsWith('http') ? base : `${window.location.origin}${base.startsWith('/') ? base : `/${base}`}`
  return `${prefix}/realtime/stream?access_token=${encodeURIComponent(token)}`
}

function dispatch(event: FinanceRealtimeEvent) {
  window.dispatchEvent(new CustomEvent(FINANCE_REALTIME_EVENT, { detail: event }))
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectFinanceRealtime()
  }, 5000)
}

/** Ouvre (ou réouvre) le flux SSE factures / devis. */
export function connectFinanceRealtime(): void {
  if (typeof window === 'undefined') return
  const url = buildStreamUrl()
  if (!url) return

  disconnectFinanceRealtime(false)

  eventSource = new EventSource(url)

  eventSource.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data) as FinanceRealtimeEvent
      if (data.type === 'heartbeat') return
      dispatch(data)
    } catch {
      /* ignore */
    }
  }

  eventSource.onerror = () => {
    disconnectFinanceRealtime(false)
    scheduleReconnect()
  }
}

export function disconnectFinanceRealtime(clearReconnect = true): void {
  if (reconnectTimer && clearReconnect) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

export function subscribeFinanceRealtime(handler: (event: FinanceRealtimeEvent) => void): () => void {
  const listener = (ev: Event) => handler((ev as CustomEvent<FinanceRealtimeEvent>).detail)
  window.addEventListener(FINANCE_REALTIME_EVENT, listener)
  return () => window.removeEventListener(FINANCE_REALTIME_EVENT, listener)
}
