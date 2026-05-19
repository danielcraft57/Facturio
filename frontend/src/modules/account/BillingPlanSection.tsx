import { useEffect, useState } from 'react'
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Typography, Link } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { billingService, type BillingUsage } from '../../services/billing'
import { unwrapApiPayload } from '../../services/clients'

export function BillingPlanSection() {
  const [usage, setUsage] = useState<BillingUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutPlan, setCheckoutPlan] = useState<'PRO' | 'PRO_EFACTURE' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    billingService
      .getUsage()
      .then((res) => setUsage(unwrapApiPayload<BillingUsage>(res)))
      .catch(() => setUsage(null))
      .finally(() => setLoading(false))
  }, [])

  const handleCheckout = async (plan: 'PRO' | 'PRO_EFACTURE') => {
    setCheckoutPlan(plan)
    setError(null)
    try {
      const res = await billingService.createCheckout(plan)
      const { url } = unwrapApiPayload<{ url: string }>(res)
      window.location.href = url
    } catch (err: unknown) {
      setError((err as Error)?.message ?? 'Impossible de démarrer le paiement Facturio')
      setCheckoutPlan(null)
    }
  }

  if (loading) {
    return <CircularProgress size={28} />
  }

  if (!usage) return null

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Abonnement Facturio
          </Typography>
          <Chip label={usage.planLabel} color={usage.plan === 'FREE' ? 'default' : 'primary'} size="small" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Le paiement de votre abonnement Facturio utilise le Stripe plateforme (compte DanielCraft / .env).
          Les paiements de vos factures clients utilisent votre propre Stripe (section ci-dessous).
        </Typography>
        {usage.limits.maxInvoicesPerMonth != null && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Factures ce mois-ci : {usage.usage.invoicesThisMonth} / {usage.limits.maxInvoicesPerMonth}
          </Typography>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          En souscrivant à un plan payant, vous acceptez les{' '}
          <Link component={RouterLink} to="/cgv" underline="hover">
            CGV
          </Link>
          .
        </Typography>
        {usage.plan === 'FREE' && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button
              variant="contained"
              disabled={!!checkoutPlan}
              onClick={() => handleCheckout('PRO')}
            >
              Passer Pro (12 €/mois)
            </Button>
            <Button
              variant="outlined"
              disabled={!!checkoutPlan}
              onClick={() => handleCheckout('PRO_EFACTURE')}
            >
              Pro + e-facture (24 €/mois)
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
