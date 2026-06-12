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

  const maxInvoices = usage.limits.maxInvoicesPerMonth ?? 25
  const maxQuotes = usage.limits.maxQuotesPerMonth ?? 10
  const maxEmails = usage.limits.maxEmailsPerMonth ?? 20
  const usedInvoices = usage.usage.invoicesThisMonth
  const usedQuotes = usage.usage.quotesThisMonth
  const usedEmails = usage.usage.emailsSentThisMonth
  const invoicePct = Math.min(100, (usedInvoices / maxInvoices) * 100)
  const quotePct = Math.min(100, (usedQuotes / maxQuotes) * 100)
  const emailPct = Math.min(100, (usedEmails / maxEmails) * 100)
  const anyLimit =
    usage.atLimit || usage.atQuoteLimit || usage.atEmailLimit

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: 2 }}>
      <Alert
        severity={anyLimit ? 'warning' : 'info'}
        action={
          <Button component={RouterLink} to="/parametres/abonnement" color="inherit" size="small">
            Passer Pro
          </Button>
        }
      >
        Plan Free — quotas mensuels (réinitialisés le 1er de chaque mois) :
        {' '}factures {usedInvoices}/{maxInvoices}, devis {usedQuotes}/{maxQuotes}, emails {usedEmails}/{maxEmails}.
        {usage.limits.pdfWatermark ? ' Les PDF incluent un filigrane Facturio.' : ''}
        {anyLimit
          ? ' Un quota est atteint — passez au plan Pro pour lever les limites.'
          : ' Passez au Pro pour un usage illimité.'}
        <LinearProgress
          variant="determinate"
          value={invoicePct}
          sx={{ mt: 1.5, height: 5, borderRadius: 3 }}
          color={usage.atLimit ? 'warning' : 'primary'}
        />
        <LinearProgress
          variant="determinate"
          value={quotePct}
          sx={{ mt: 0.75, height: 5, borderRadius: 3 }}
          color={usage.atQuoteLimit ? 'warning' : 'info'}
        />
        <LinearProgress
          variant="determinate"
          value={emailPct}
          sx={{ mt: 0.75, height: 5, borderRadius: 3 }}
          color={usage.atEmailLimit ? 'warning' : 'secondary'}
        />
      </Alert>
    </Box>
  )
}
