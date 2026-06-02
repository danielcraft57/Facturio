import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  LinearProgress,
  Link,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Link as RouterLink } from 'react-router-dom'
import { billingService, type BillingUsage, type SaasCheckoutSchedule } from '../../services/billing'
import { unwrapApiPayload } from '../../services/clients'
import { invalidateBillingUsageCache } from '../../hooks/useBillingUsage'

const PLAN_PRICES: Record<'PRO' | 'PRO_EFACTURE', string> = {
  PRO: '12 €/mois',
  PRO_EFACTURE: '24 €/mois',
}

const BILLING_SCHEDULE_OPTIONS: {
  value: SaasCheckoutSchedule
  label: string
  description: string
}[] = [
  {
    value: 'MONTHLY',
    label: 'Mensuel',
    description: 'Prélèvement automatique chaque mois (Stripe gère les renouvellements).',
  },
  {
    value: 'QUARTERLY',
    label: 'Trimestriel',
    description: 'Une facture tous les 3 mois, montant = 3 × le tarif mensuel, prélèvement automatique.',
  },
  {
    value: 'BIANNUAL',
    label: 'Semestriel',
    description: 'Une facture tous les 6 mois, montant = 6 × le tarif mensuel, prélèvement automatique.',
  },
  {
    value: 'YEARLY_UPFRONT',
    label: '12 mois en une fois',
    description: 'Paiement unique pour 12 mois d’accès — pas de renouvellement automatique sur Stripe.',
  },
]

function formatPeriodEnd(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

function statusLabel(status: string | null): { label: string; color: 'success' | 'warning' | 'default' | 'error' } {
  switch (status) {
    case 'active':
      return { label: 'Actif', color: 'success' }
    case 'trialing':
      return { label: 'Essai', color: 'success' }
    case 'cancel_at_period_end':
      return { label: 'Résiliation programmée', color: 'warning' }
    case 'past_due':
      return { label: 'Paiement en attente', color: 'warning' }
    case 'canceled':
      return { label: 'Résilié', color: 'default' }
    case 'unpaid':
      return { label: 'Impayé', color: 'error' }
    default:
      return { label: status ?? '—', color: 'default' }
  }
}

type BillingPlanSectionProps = {
  onBillingMessage?: (type: 'success' | 'cancelled' | null) => void
  /** Incrémenté après sync post-checkout pour recharger l’usage. */
  reloadKey?: number
}

export function BillingPlanSection({ onBillingMessage, reloadKey = 0 }: BillingPlanSectionProps) {
  const [usage, setUsage] = useState<BillingUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutPlan, setCheckoutPlan] = useState<'PRO' | 'PRO_EFACTURE' | null>(null)
  const [billingSchedule, setBillingSchedule] = useState<SaasCheckoutSchedule>('MONTHLY')
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUsage = useCallback(async (syncStripe = true) => {
    setLoading(true)
    try {
      if (syncStripe) {
        try {
          await billingService.syncSubscription()
        } catch {
          // Sync optionnelle (Stripe indisponible, etc.)
        }
        invalidateBillingUsageCache()
      }
      const res = await billingService.getUsage()
      setUsage(unwrapApiPayload<BillingUsage>(res))
    } catch {
      setUsage(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsage(true)
  }, [loadUsage, reloadKey])

  const handleCheckout = async (plan: 'PRO' | 'PRO_EFACTURE') => {
    setCheckoutPlan(plan)
    setError(null)
    try {
      const res = await billingService.createCheckout(plan, billingSchedule)
      const { url } = unwrapApiPayload<{ url: string }>(res)
      window.location.href = url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Impossible de démarrer le paiement')
      setCheckoutPlan(null)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    setError(null)
    try {
      const res = await billingService.createPortal()
      const { url } = unwrapApiPayload<{ url: string }>(res)
      window.location.href = url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Portail de facturation indisponible')
      setPortalLoading(false)
    }
  }

  const refreshAfterReturn = useCallback(() => {
    void loadUsage(true)
    onBillingMessage?.(null)
  }, [loadUsage, onBillingMessage])

  if (loading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <LinearProgress sx={{ borderRadius: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Chargement de votre abonnement…
          </Typography>
        </CardContent>
      </Card>
    )
  }

  if (!usage) {
    return (
      <Alert severity="warning">
        Impossible de charger les informations d’abonnement. Vérifiez que le serveur API est démarré.
      </Alert>
    )
  }

  const sub = usage.subscription
  const periodLabel = formatPeriodEnd(sub?.currentPeriodEnd ?? null)
  const statusChip = sub?.status ? statusLabel(sub.status) : null
  const cancelScheduled = sub?.cancelAtPeriodEnd === true
  const isFree = usage.plan === 'FREE'
  const isPrepaidYearly = !isFree && sub && !sub.hasRecurringSubscription && !!periodLabel
  const max = usage.limits.maxInvoicesPerMonth
  const quotaPct =
    max != null && max > 0 ? Math.min(100, (usage.usage.invoicesThisMonth / max) * 100) : 0

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Abonnement Facturio
          </Typography>
          <Chip label={usage.planLabel} color={isFree ? 'default' : 'primary'} size="small" />
          {statusChip && (
            <Chip label={statusChip.label} color={statusChip.color} size="small" variant="outlined" />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 2 }}>
          Paiement de votre abonnement Facturio via Stripe (compte plateforme). Les encaissements de vos
          factures clients restent sur votre propre Stripe (section Paiements). Vos informations
          d’organisation (nom, adresse si renseignée) sont synchronisées sur la fiche client Stripe pour
          préremplir le formulaire Checkout. Personnalisation de la page :{' '}
          <Link
            href="https://docs.stripe.com/payments/checkout/customize"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
          >
            doc Stripe — Customize Checkout
          </Link>{' '}
          et variables{' '}
          <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
            STRIPE_CHECKOUT_*
          </Box>{' '}
          côté serveur.
        </Typography>

        {isFree && (
          <FormControl component="fieldset" variant="standard" sx={{ mb: 2, width: '100%' }}>
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
              Fréquence de paiement
            </FormLabel>
            <RadioGroup
              value={billingSchedule}
              onChange={(_, v) => setBillingSchedule(v as SaasCheckoutSchedule)}
            >
              {BILLING_SCHEDULE_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio size="small" />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {opt.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {opt.description}
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', ml: 0, mb: 0.5 }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}

        {cancelScheduled && periodLabel && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Résiliation programmée. Vous conservez l’accès <strong>{usage.planLabel}</strong> jusqu’au{' '}
            <strong>{periodLabel}</strong>. Aucun nouveau prélèvement ne sera effectué.
          </Alert>
        )}

        {periodLabel && !isFree && !cancelScheduled && sub?.hasRecurringSubscription && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Prochain prélèvement : <strong>{periodLabel}</strong>
          </Typography>
        )}

        {isPrepaidYearly && !cancelScheduled && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            Accès payé jusqu’au <strong>{periodLabel}</strong> (paiement unique, sans renouvellement
            automatique).
          </Typography>
        )}

        {max != null && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Factures ce mois-ci : {usage.usage.invoicesThisMonth} / {max}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Compteur remis à zéro le 1er de chaque mois (mois calendaire).
            </Typography>
            <LinearProgress
              variant="determinate"
              value={quotaPct}
              color={usage.atLimit ? 'warning' : 'primary'}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {sub?.status === 'past_due' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Votre dernier paiement a échoué. Mettez à jour votre carte pour conserver l’accès Pro.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          En souscrivant, vous acceptez les{' '}
          <Link component={RouterLink} to="/cgv" underline="hover">
            CGV
          </Link>
          .
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {isFree ? (
            <>
              <Button
                variant="contained"
                disabled={!!checkoutPlan}
                onClick={() => handleCheckout('PRO')}
                startIcon={checkoutPlan === 'PRO' ? <CircularProgress size={18} color="inherit" /> : undefined}
              >
                Passer Pro ({PLAN_PRICES.PRO})
              </Button>
              <Button
                variant="outlined"
                disabled={!!checkoutPlan}
                onClick={() => handleCheckout('PRO_EFACTURE')}
                startIcon={
                  checkoutPlan === 'PRO_EFACTURE' ? <CircularProgress size={18} color="inherit" /> : undefined
                }
              >
                Pro + e-facture ({PLAN_PRICES.PRO_EFACTURE})
              </Button>
            </>
          ) : (
            <>
              {sub?.canManagePortal && (
                <Button
                  variant="contained"
                  onClick={handlePortal}
                  disabled={portalLoading}
                  startIcon={
                    portalLoading ? <CircularProgress size={18} color="inherit" /> : <CreditCardIcon />
                  }
                  endIcon={<OpenInNewIcon fontSize="small" />}
                >
                  Gérer l’abonnement (Stripe)
                </Button>
              )}
              <Button variant="outlined" onClick={refreshAfterReturn}>
                Actualiser
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
