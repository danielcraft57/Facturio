import { useEffect, useRef } from 'react'
import { connectFinanceRealtime, disconnectFinanceRealtime, subscribeFinanceRealtime } from '../services/financeRealtime'
import { useInvoicesStore } from '../stores/invoicesStore'
import { useQuotesStore } from '../stores/quotesStore'
import { useAuthStore } from '../stores/authStore'
import { useAppNotifications } from '../stores/appStore'
import { useToast } from './useToast'
import { buildNotificationFromRealtime, buildRealtimeDetail } from '../utils/financeRealtimeUi'
import type { FinanceRealtimeDetail } from '../types/realtime'
import { apiClient } from '../services/api'

function dispatchDetail(detail: FinanceRealtimeDetail) {
  const name =
    detail.resource === 'invoices'
      ? 'facturio:invoice-realtime'
      : detail.resource === 'payables'
        ? 'facturio:payables-realtime'
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

  const handlersRef = useRef({
    fetchInvoices,
    fetchQuotes,
    markInvoicesStale,
    markQuotesStale,
    addNotification,
    toast,
  })
  handlersRef.current = {
    fetchInvoices,
    fetchQuotes,
    markInvoicesStale,
    markQuotesStale,
    addNotification,
    toast,
  }

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

      const h = handlersRef.current

      if (detail.resource === 'invoices') {
        apiClient.invalidateCache('/factures')
        apiClient.invalidateCache('/invoices')
        h.markInvoicesStale()
        void h.fetchInvoices()
      }
      if (detail.resource === 'quotes') {
        apiClient.invalidateCache('/devis')
        apiClient.invalidateCache('/quotes')
        h.markQuotesStale()
        void h.fetchQuotes()
      }
      dispatchDetail(detail)

      const notif = buildNotificationFromRealtime(detail)
      h.addNotification(notif)

      const toastText = `${notif.title} — ${notif.message}`
      if (detail.action === 'created') {
        h.toast.success(toastText, { duration: 10000 })
      } else if (detail.action === 'sent') {
        h.toast.info(toastText, { duration: 9500 })
      } else if (detail.action === 'paid') {
        h.toast.success(toastText, { duration: 10000 })
      } else if (detail.action === 'deleted') {
        h.toast.warning(toastText, { duration: 9000 })
      } else if (detail.action === 'updated') {
        h.toast.info(toastText, { duration: 9000 })
      }
    })
  }, [isAuthenticated])

  return null
}
