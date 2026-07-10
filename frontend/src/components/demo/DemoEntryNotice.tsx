import { useEffect } from 'react'
import { Alert, Box } from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { demoService } from '../../services/demoService'

/**
 * Affiche une fois le message de bienvenue après entrée dans la démo (/essayer).
 */
export function DemoEntryNotice() {
  const location = useLocation()
  const navigate = useNavigate()
  const demoMessage = (location.state as { demoMessage?: string } | null)?.demoMessage

  useEffect(() => {
    if (!demoMessage || !demoService.isDemoSession()) return
    const nextState = { ...(location.state as object | null) }
    delete (nextState as { demoMessage?: string }).demoMessage
    navigate(location.pathname + location.search, {
      replace: true,
      state: Object.keys(nextState).length > 0 ? nextState : null,
    })
  }, [demoMessage, location.pathname, location.search, location.state, navigate])

  if (!demoMessage || !demoService.isDemoSession()) return null

  return (
    <Box sx={{ pb: 1.5 }}>
      <Alert severity="success">{demoMessage}</Alert>
    </Box>
  )
}
