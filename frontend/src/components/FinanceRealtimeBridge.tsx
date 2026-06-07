import { useEffect } from 'react'
import { connectFinanceRealtime, disconnectFinanceRealtime, subscribeFinanceRealtime } from '../services/financeRealtime'
import { useInvoicesStore } from '../stores/invoicesStore'
import { useQuotesStore } from '../stores/quotesStore'
import { useAuthStore } from '../stores/authStore'
import { useAppNotifications } from '../stores/appStore'
import { useToast } from './useToast'
import { buildNotificationFromRealtime, buildRealtimeDetail } from '../utils/financeRealtimeUi'
import type { FinanceRealtimeDetail } from '../types/realtime'

function dispatchDetail(detail: FinanceRealtimeDetail) {
  const name =
    detail.resource === 'invoices'
      ? 'facturio:invoice-realtime'
      : detail.resource === 'payables'
        ? 'facturio:payables-realtime'
        : detail.resource === 'products'
          ? 'facturio:products-realtime'
          : 'facturio:quote-realtime'
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

/**
 * Connexion SSE : rafraîchit les listes, notifications centre, toasts et surbrillance.
 */
export function FinanceRealtimeBridge() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const fetchInvoices = useInvoicesStore((s) => s.fetchInvoices)
  const markInvoicesStale = useInvoicesStore((s) => s.markAsStale)
  const fetchQuotes = useQuotesStore((s) => s.fetchQuotes)
  const markQuotesStale = useQuotesStore((s) => s.markAsStale)
  const addNotification = useAppNotifications().addNotification
  const toast = useToast()

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectFinanceRealtime()
      return
    }
    connectFinanceRealtime()
    return () => disconnectFinanceRealtime()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return

    return subscribeFinanceRealtime((event) => {
      if (event.type === 'connected' || event.type === 'heartbeat') return

      const detail = buildRealtimeDetail(event)
      if (!detail) return

      if (detail.resource === 'invoices') {
        markInvoicesStale()
        void fetchInvoices()
      }
      if (detail.resource === 'quotes') {
        markQuotesStale()
        void fetchQuotes()
      }
      dispatchDetail(detail)

      const notif = buildNotificationFromRealtime(detail)
      addNotification(notif)

      const toastText = `${notif.title} — ${notif.message}`
      if (detail.action === 'created') {
        toast.success(toastText, { duration: 10000 })
      } else if (detail.action === 'sent') {
        toast.info(toastText, { duration: 9500 })
      } else if (detail.action === 'paid') {
        toast.success(toastText, { duration: 10000 })
      } else if (detail.action === 'deleted') {
        toast.warning(toastText, { duration: 9000 })
      } else if (detail.action === 'updated') {
        toast.info(toastText, { duration: 9000 })
      }
    })
  }, [
    isAuthenticated,
    fetchInvoices,
    fetchQuotes,
    markInvoicesStale,
    markQuotesStale,
    addNotification,
    toast,
  ])

  return null
}
