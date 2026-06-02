import { useEffect } from 'react'
import { getAuthToken } from '../services/sessionStorage'
import { startRealtime, stopRealtime, onRealtimeEvent } from '../services/realtimeService'
import { prepareNotifications, pushLocalNotification } from '../services/notificationService'
import { registerPushToken } from '../services/mobileNotificationsService'
import {
  enqueueOfflineAction,
  flushOfflineQueue,
  getOfflineQueueSize,
  type OfflineAction,
} from '../services/offlineQueueService'
import { onNetworkChange, startNetworkWatcher } from '../services/networkService'
import type { RealtimeEvent } from '../types/realtime'
import { useLiveSyncStore } from '../stores/liveSyncStore'
import { useRealtimeEventsStore } from '../stores/realtimeEventsStore'

function eventLabel(event: RealtimeEvent) {
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

export async function queueOrRunAction(action: Omit<OfflineAction, 'id' | 'createdAt'>, online: boolean) {
  if (online) {
    const { apiClient } = await import('../services/apiClient')
    await apiClient.request(action.method, action.url, action.body)
    return { queued: false }
  }
  await enqueueOfflineAction(action)
  return { queued: true }
}

export function useLiveSync(enabled: boolean) {
  const bumpInvoices = useLiveSyncStore((s) => s.bumpInvoices)
  const bumpQuotes = useLiveSyncStore((s) => s.bumpQuotes)
  const pushRealtimeEvent = useRealtimeEventsStore((s) => s.pushEvent)

  useEffect(() => {
    if (!enabled) return

    let unsubRealtime: (() => void) | null = null
    let unsubNetwork: (() => void) | null = null
    let stopped = false

    const boot = async () => {
      startNetworkWatcher()
      const pushToken = await prepareNotifications()
      if (pushToken) {
        try {
          await registerPushToken(pushToken)
        } catch {
          // on garde la synchro locale même si l'enregistrement serveur échoue
        }
      }

      const token = await getAuthToken()
      if (!token || stopped) return

      startRealtime(token)
      unsubRealtime = onRealtimeEvent(async (event) => {
        if (event.type === 'heartbeat' || event.type === 'connected') return

        pushRealtimeEvent(event)

        if (event.resource === 'invoices') bumpInvoices()
        if (event.resource === 'quotes') bumpQuotes()

        await pushLocalNotification('Mise à jour client', eventLabel(event), {
          resource: event.resource,
          action: event.action,
          status: event.status,
          id: event.id,
        })
      })

      unsubNetwork = onNetworkChange(async (online) => {
        if (!online) return
        const pending = await getOfflineQueueSize()
        if (!pending) return
        const result = await flushOfflineQueue()
        if (result.processed > 0) {
          bumpInvoices()
          bumpQuotes()
          await pushLocalNotification(
            'Synchronisation terminée',
            `${result.processed} action(s) envoyée(s) après reconnexion.`,
          )
        }
      })
    }

    boot()

    return () => {
      stopped = true
      unsubRealtime?.()
      unsubNetwork?.()
      stopRealtime()
    }
  }, [enabled, bumpInvoices, bumpQuotes, pushRealtimeEvent])
}
