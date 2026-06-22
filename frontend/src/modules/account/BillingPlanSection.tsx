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
  TextField,
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
  const [betaCode, setBetaCode] = useState('')
  const [betaRedeemLoading, setBetaRedeemLoading] = useState(false)
  const [betaSuccess, setBetaSuccess] = useState<string | null>(null)
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

  const handleRedeemBeta = async () => {
    const code = betaCode.trim()
    if (!code) {
      setError('Saisissez un code d\'invitation beta.')
      return
    }
    setBetaRedeemLoading(true)
    setError(null)
    setBetaSuccess(null)
    try {
      const res = await billingService.redeemBetaInvite(code)
      const payload = unwrapApiPayload<{
        planLabel: string
        expiresAt: string
      }>(res)
      const end = formatPeriodEnd(payload.expiresAt)
      setBetaSuccess(
        `Programme beta activé : ${payload.planLabel}${end ? ` jusqu'au ${end}` : ''}.`,
      )
      setBetaCode('')
      invalidateBillingUsageCache()
      await loadUsage(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Code beta invalide ou indisponible')
    } finally {
      setBetaRedeemLoading(false)
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
  const betaActive = usage.betaTester?.active === true
  const betaExpired = usage.betaTester != null && !betaActive
  const isPrepaidYearly = !isFree && sub && !sub.hasRecurringSubscription && !!periodLabel

  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Abonnement PrestaFacture
          </Typography>
          <Chip label={usage.planLabel} color={isFree ? 'default' : 'primary'} size="small" />
          {statusChip && (
            <Chip label={statusChip.label} color={statusChip.color} size="small" variant="outlined" />
          )}
        </Box>

        {betaActive && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Vous participez au programme beta testeurs.
            {usage.betaTester?.daysRemaining != null
              ? ` Il vous reste ${usage.betaTester.daysRemaining} jour(s) d'accès complet`
              : ' Accès complet actif'}
            {usage.betaTester?.expiresAt
              ? ` (jusqu'au ${formatPeriodEnd(usage.betaTester.expiresAt) ?? '—'}).`
              : '.'}
            {' '}Merci de tester PrestaFacture en conditions réelles : vos retours nous aident à améliorer le produit.
          </Alert>
        )}

        {betaExpired && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Votre période beta testeur est terminée. Passez à un plan payant pour conserver l&apos;accès complet.
          </Alert>
        )}

        {betaSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setBetaSuccess(null)}>
            {betaSuccess}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 2 }}>
          Paiement de votre abonnement PrestaFacture via Stripe (compte plateforme). Les encaissements de vos
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

        {isFree && !usage.betaTester && (
          <Box sx={{ mb: 2, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              Code beta testeur
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Vous avez reçu une invitation ? Activez 3 mois gratuits avec accès complet (plan Agence).
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                size="small"
                label="Code d'invitation"
                value={betaCode}
                onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
                placeholder="DEV26"
                sx={{ flex: '1 1 220px' }}
              />
              <Button
                variant="outlined"
                onClick={() => void handleRedeemBeta()}
                disabled={betaRedeemLoading || betaCode.trim().length === 0}
                sx={{ mt: 0.25 }}
              >
                {betaRedeemLoading ? 'Activation…' : 'Activer le code'}
              </Button>
            </Box>
          </Box>
        )}

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

        {isFree && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Suivez vos quotas mensuels (factures, devis, emails) sur la page dédiée.
            </Typography>
            <Button variant="outlined" component={RouterLink} to="/parametres/quotas" size="small">
              Voir quotas & usage
            </Button>
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
