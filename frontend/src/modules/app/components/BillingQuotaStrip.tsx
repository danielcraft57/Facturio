import { Alert, Button, Box } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useBillingUsage } from '../../../hooks/useBillingUsage'
import { hasQuotaAlert } from '../../account/components/QuotaUsagePanel'

/**
 * Bandeau discret affiché uniquement quand un quota Free approche ou est atteint.
 * Le détail complet est sur /parametres/quotas.
 */
export function BillingQuotaStrip() {
  const { usage, loading } = useBillingUsage()

  if (loading || !usage || usage.plan !== 'FREE') return null
  if (!hasQuotaAlert(usage)) return null

  const anyLimit = usage.atLimit || usage.atQuoteLimit || usage.atEmailLimit
  const parts: string[] = []
  if (usage.atLimit) parts.push('factures')
  if (usage.atQuoteLimit) parts.push('devis')
  if (usage.atEmailLimit) parts.push('emails')

  const message =
    anyLimit && parts.length > 0
      ? `Quota atteint (${parts.join(', ')}) — certaines actions sont bloquées ce mois-ci.`
      : "Vous approchez d'un quota mensuel sur le plan Free."

  return (
    <Box sx={{ px: { xs: 0, md: 0 }, pb: 1.5 }}>
      <Alert
        severity={anyLimit ? 'warning' : 'info'}
        action={
          <Button component={RouterLink} to="/parametres/quotas" color="inherit" size="small">
            Voir les quotas
          </Button>
        }
      >
        {message}
      </Alert>
    </Box>
  )
}
