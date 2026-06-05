import { Platform } from 'react-native'
import { getApiBaseUrl } from '../utils/api'
import type { RealtimeEvent } from '../types/realtime'

type Listener = (event: RealtimeEvent) => void

let listeners = new Set<Listener>()
let source: any = null

function emit(event: RealtimeEvent) {
  listeners.forEach((l) => l(event))
}

function streamUrl(token: string) {
  const base = getApiBaseUrl().replace(/\/$/, '')
  return `${base}/realtime/stream?access_token=${encodeURIComponent(token)}`
}

export function onRealtimeEvent(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function stopRealtime() {
  if (source) {
    try {
      source.close?.()
    } catch {
      // noop
    }
  }
  source = null
}

export function startRealtime(token: string) {
  stopRealtime()
  const url = streamUrl(token)

  if (Platform.OS === 'web' && typeof EventSource !== 'undefined') {
    const es = new EventSource(url)
    es.onmessage = (evt) => {
      try {
        emit(JSON.parse(evt.data) as RealtimeEvent)
      } catch {
        // ignore malformed frame
      }
    }
    source = es
    return
  }

  const EventSourceImpl = require('react-native-sse').default
  const es = new EventSourceImpl(url, {
    pollingInterval: 5000,
    lineEndingCharacter: '\n',
  })
  es.addEventListener('message', (evt: { data?: string }) => {
    if (!evt?.data) return
    try {
      emit(JSON.parse(evt.data) as RealtimeEvent)
    } catch {
      // ignore malformed frame
    }
  })
  source = es
}
