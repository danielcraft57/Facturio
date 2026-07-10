import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useToast } from '../useToast'
import { demoService } from '../../services/demoService'

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
    const state = location.state as { demoMessage?: string } | null
    const message = state?.demoMessage?.trim()
    if (!message || shownRef.current) return

    shownRef.current = true
    toast.success(message, {
      title: 'Espace démo prêt',
      duration: 10_000,
      action: (
        <Button component={RouterLink} to="/factures/inbox" size="small" color="inherit">
          Voir les factures
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
