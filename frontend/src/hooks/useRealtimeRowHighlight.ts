import { useCallback, useEffect, useState } from 'react'
import type { FinanceRealtimeDetail, RealtimeHighlightTone, RealtimeResource } from '../types/realtime'
import { HIGHLIGHT_DURATION_MS } from '../utils/financeRealtimeUi'
import { actionToHighlightTone } from '../utils/financeRealtimeUi'

export type RowHighlightState = Record<string, RealtimeHighlightTone>

function eventNameFor(resource: RealtimeResource) {
  return resource === 'invoices' ? 'facturio:invoice-realtime' : 'facturio:quote-realtime'
}

/**
 * Surbrillance temporaire des lignes (liste factures / devis) à chaque événement SSE.
 */
export function useRealtimeRowHighlight(resource: RealtimeResource) {
  const [highlights, setHighlights] = useState<RowHighlightState>({})

  const applyHighlight = useCallback((detail: FinanceRealtimeDetail) => {
    if (detail.resource !== resource || detail.id == null) return
    const key = String(detail.id)
    const tone = detail.tone ?? actionToHighlightTone(detail.action)
    setHighlights((prev) => ({ ...prev, [key]: tone }))
    const ms = HIGHLIGHT_DURATION_MS[tone]
    window.setTimeout(() => {
      setHighlights((prev) => {
        if (prev[key] !== tone) return prev
        const next = { ...prev }
        delete next[key]
        return next
      })
    }, ms)
  }, [resource])

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<FinanceRealtimeDetail>).detail
      if (detail) applyHighlight(detail)
    }
    window.addEventListener(eventNameFor(resource), handler)
    return () => window.removeEventListener(eventNameFor(resource), handler)
  }, [resource, applyHighlight])

  return highlights
}

/**
 * Surbrillance du panneau détail (fiche facture).
 */
export function useRealtimePanelHighlight(resource: RealtimeResource, entityId: string | undefined) {
  const [tone, setTone] = useState<RealtimeHighlightTone | undefined>()

  useEffect(() => {
    if (!entityId) return
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<FinanceRealtimeDetail>).detail
      if (!detail || detail.resource !== resource) return
      if (detail.id == null || String(detail.id) !== entityId) return
      const t = detail.tone ?? actionToHighlightTone(detail.action)
      setTone(t)
      window.setTimeout(() => setTone(undefined), HIGHLIGHT_DURATION_MS[t])
    }
    window.addEventListener(eventNameFor(resource), handler)
    return () => window.removeEventListener(eventNameFor(resource), handler)
  }, [resource, entityId])

  return tone
}
