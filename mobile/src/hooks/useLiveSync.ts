import { useEffect } from 'react'
import { Platform } from 'react-native'
import { getAuthToken } from '../services/sessionStorage'
import { useLiveSyncStore } from '../stores/liveSyncStore'
import { useRealtimeEventsStore } from '../stores/realtimeEventsStore'
import type { OfflineAction } from '../services/offlineQueueService'
import { formatRealtimeEventLabel } from '../utils/realtimeEventLabel'
import { scheduleWhenIdle } from '../utils/scheduleWhenIdle'
import { usesNativeNotifications } from '../services/notificationService'

export async function queueOrRunAction(action: Omit<OfflineAction, 'id' | 'createdAt'>, online: boolean) {
  if (online) {
    const { apiClient } = await import('../services/apiClient')
    await apiClient.request(action.method, action.url, action.body)
    return { queued: false }
  }
  const { enqueueOfflineAction } = await import('../services/offlineQueueService')
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
    let cancelIdle: (() => void) | null = null
    let stopped = false

    const boot = async () => {
      if (stopped) return

      const { startNetworkWatcher, onNetworkChange } = await import('../services/networkService')
      const notificationApi = usesNativeNotifications()
        ? await import('../services/notificationService')
        : {
            prepareNotifications: async () => null,
            pushLocalNotification: async () => {},
          }
      const { prepareNotifications, pushLocalNotification } = notificationApi
      const { startRealtime, onRealtimeEvent } = await import('../services/realtimeService')
      const { registerPushToken } = await import('../services/mobileNotificationsService')
      const { getOfflineQueueSize, flushOfflineQueue } = await import('../services/offlineQueueService')

      startNetworkWatcher()

      if (usesNativeNotifications()) {
        const pushToken = await prepareNotifications()
        if (pushToken) {
          try {
            await registerPushToken(pushToken)
          } catch {
            // synchro locale même si l'enregistrement serveur échoue
          }
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

        await pushLocalNotification('Mise à jour client', formatRealtimeEventLabel(event), {
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

    cancelIdle = scheduleWhenIdle(() => {
      void boot()
    }, Platform.OS)

    return () => {
      stopped = true
      cancelIdle?.()
      unsubRealtime?.()
      unsubNetwork?.()
      void import('../services/realtimeService').then(({ stopRealtime }) => stopRealtime())
      void import('../services/networkService').then(({ stopNetworkWatcher }) => stopNetworkWatcher())
    }
  }, [enabled, bumpInvoices, bumpQuotes, pushRealtimeEvent])
}
