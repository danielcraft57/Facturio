import { Alert, Button, LinearProgress, Box, Skeleton } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useBillingUsage } from '../../../hooks/useBillingUsage'

export function BillingUsageBanner() {
  const { usage, loading } = useBillingUsage()

  if (loading) {
    return (
      <Box sx={{ px: { xs: 2, md: 3 }, pt: 2 }}>
        <Skeleton variant="rounded" height={72} />
      </Box>
    )
  }

  if (!usage || usage.plan !== 'FREE') return null

  const max = usage.limits.maxInvoicesPerMonth ?? 10
  const used = usage.usage.invoicesThisMonth
  const pct = Math.min(100, (used / max) * 100)

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: 2 }}>
      <Alert
        severity={usage.atLimit ? 'warning' : 'info'}
        action={
          <Button component={RouterLink} to="/tarifs" color="inherit" size="small">
            Passer Pro
          </Button>
        }
      >
        Plan Free : {used} / {max} factures ce mois-ci.
        {usage.atLimit
          ? ' Création bloquée — passez au plan Pro pour continuer.'
          : ' Passez au Pro pour des factures illimitées.'}
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ mt: 1.5, height: 6, borderRadius: 3 }}
          color={usage.atLimit ? 'warning' : 'primary'}
        />
      </Alert>
    </Box>
  )
}
