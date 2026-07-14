import { useEffect, useState } from 'react'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import PeopleIcon from '@mui/icons-material/People'
import { createElement } from 'react'
import { invoiceService } from '../services/invoices'
import { clientService } from '../services/clients'
import type { CommandPaletteItem } from '../modules/app/config/commandPaletteConfig'

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 280
const MAX_RESULTS_PER_KIND = 5

/**
 * Recherche factures et clients pour la palette Cmd+K (debounce côté client).
 *
 * @param query - Texte saisi dans la palette
 * @param enabled - Palette ouverte et recherche active
 * @returns Items « Résultats » prêts à afficher
 */
export function useCommandPaletteEntitySearch(query: string, enabled: boolean): {
  items: CommandPaletteItem[]
  loading: boolean
} {
  const [items, setItems] = useState<CommandPaletteItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (!enabled || trimmed.length < MIN_QUERY_LENGTH) {
      setItems([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const [invoiceRes, clientRes] = await Promise.all([
            invoiceService.getInvoices({ search: trimmed, limit: MAX_RESULTS_PER_KIND, page: 1 }),
            clientService.searchClients(trimmed),
          ])

          if (cancelled) return

          const paletteItems: CommandPaletteItem[] = []

          for (const invoice of invoiceRes.data?.invoices ?? []) {
            paletteItems.push({
              id: `entity-invoice-${invoice.id}`,
              label: invoice.number,
              description: invoice.client?.name ? `Facture · ${invoice.client.name}` : 'Facture',
              keywords: [invoice.number, invoice.client?.name ?? ''].filter(Boolean),
              to: `/factures/voir/${invoice.id}`,
              icon: createElement(ReceiptLongIcon, { fontSize: 'small' }),
              kind: 'action',
              groupLabel: 'Résultats',
            })
          }

          for (const client of clientRes.data ?? []) {
            paletteItems.push({
              id: `entity-client-${client.id}`,
              label: client.name,
              description: client.email || 'Client',
              keywords: [client.name, client.email].filter(Boolean),
              to: `/clients/${client.id}`,
              icon: createElement(PeopleIcon, { fontSize: 'small' }),
              kind: 'action',
              groupLabel: 'Résultats',
            })
          }

          setItems(paletteItems)
        } catch {
          if (!cancelled) setItems([])
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [enabled, query])

  return { items, loading }
}
