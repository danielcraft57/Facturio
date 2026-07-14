import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useToast } from '../useToast'
import { demoService } from '../../services/demoService'
import { isDemoInvoiceDetailPath } from '../../utils/demoHeroPaths'
import { getDemoIntent, type DemoIntent } from '../../utils/demoIntent'

type DemoEntryState = {
  demoMessage?: string
  demoIntent?: DemoIntent
}

/**
 * Résout le CTA du toast d'entrée démo selon le parcours choisi.
 *
 * @param pathname - Page d'atterrissage
 * @param intent - Profil `/essayer` mémorisé
 */
function resolveDemoEntryToastAction(
  pathname: string,
  intent: DemoIntent | null,
): { to: string; label: string } {
  if (isDemoInvoiceDetailPath(pathname)) {
    return { to: pathname, label: 'Continuer sur cette facture' }
  }
  if (intent === 'compliance' || pathname.startsWith('/parametres/facturation-electronique')) {
    return { to: '/parametres/facturation-electronique', label: 'Voir le score conformité' }
  }
  if (intent === 'start' || pathname.startsWith('/devis')) {
    return { to: '/devis/inbox', label: 'Voir les devis exemple' }
  }
  return { to: '/factures/inbox', label: 'Voir les factures' }
}

/**
 * Affiche une fois le message de bienvenue après entrée via /essayer.
 */
export function DemoEntryMessageNotifier() {
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const shownRef = useRef(false)

  useEffect(() => {
    if (!demoService.isDemoSession()) return
    const state = location.state as DemoEntryState | null
    const message = state?.demoMessage?.trim()
    if (!message || shownRef.current) return

    shownRef.current = true
    const intent = state?.demoIntent ?? getDemoIntent()
    const action = resolveDemoEntryToastAction(location.pathname, intent)

    toast.success(message, {
      title: 'Espace démo prêt',
      duration: 10_000,
      action: (
        <Button component={RouterLink} to={action.to} size="small" color="inherit">
          {action.label}
        </Button>
      ),
    })

    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: {} },
    )
  }, [location.hash, location.pathname, location.search, location.state, navigate, toast])

  return null
}
