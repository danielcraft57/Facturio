import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '@mui/material'
import { demoService } from '../../services/demoService'
import { useToast } from '../useToast'
import {
  hasSeenDemoCmdkHint,
  hasSkippedDemoWelcome,
  markDemoCmdkHintSeen,
} from '../../utils/demoExploreStorage'
import { isDemoInvoiceDetailPath } from '../../utils/demoHeroPaths'

/**
 * Astuces one-shot après « Explorer seul » sur la welcome démo (transcript onboarding skippé).
 */
export function DemoContextualHints() {
  const location = useLocation()
  const toast = useToast()
  const cmdkShownRef = useRef(false)

  useEffect(() => {
    if (!demoService.isDemoSession()) return
    if (!hasSkippedDemoWelcome()) return
    if (hasSeenDemoCmdkHint() || cmdkShownRef.current) return
    if (location.pathname !== '/dashboard') return

    cmdkShownRef.current = true
    markDemoCmdkHintSeen()

    toast.info('Ctrl+K ouvre la recherche rapide : facture, client, score conformité.', {
      title: 'Astuce navigation',
      duration: 11_000,
      action: (
        <Button
          size="small"
          color="inherit"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))
          }}
        >
          Ouvrir
        </Button>
      ),
    })
  }, [location.pathname, toast])

  useEffect(() => {
    if (!demoService.isDemoSession()) return
    if (!hasSkippedDemoWelcome()) return
    if (!isDemoInvoiceDetailPath(location.pathname)) return
    if (sessionStorage.getItem('facturio_demo_efacture_hint_seen') === '1') return

    sessionStorage.setItem('facturio_demo_efacture_hint_seen', '1')
    toast.info('Descendez sur la page pour voir le score conformité Factur-X de cette facture.', {
      title: 'Conformité 2026',
      duration: 9_000,
    })
  }, [location.pathname, toast])

  return null
}
