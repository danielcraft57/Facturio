import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Skeleton,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import type { BillingUsage } from '../../../services/billing'

const QUOTA_WARN_PCT = 80

type QuotaRowProps = {
  label: string
  used: number
  max: number
  atLimit: boolean
}

/**
 * Ligne de quota avec barre de progression.
 */
function QuotaRow({ label, used, max, atLimit }: QuotaRowProps) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0
  const nearLimit = !atLimit && pct >= QUOTA_WARN_PCT
  const color = atLimit ? 'warning' : nearLimit ? 'warning' : 'primary'

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="body2" color={atLimit ? 'warning.main' : 'text.secondary'}>
          {used} / {max}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} color={color} sx={{ height: 8, borderRadius: 4 }} />
      {atLimit && (
        <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
          Quota atteint — création ou envoi bloqué jusqu'au prochain mois.
        </Typography>
      )}
      {nearLimit && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          Plus que {max - used} restant{max - used > 1 ? 's' : ''} ce mois-ci.
        </Typography>
      )}
    </Box>
  )
}

function formatResetDate(iso: string | undefined): string | null {
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

type QuotaUsagePanelProps = {
  usage: BillingUsage
  showUpgradeCta?: boolean
}

/**
 * Panneau détaillé des quotas mensuels (plan Free).
 */
export function QuotaUsagePanel({ usage, showUpgradeCta = true }: QuotaUsagePanelProps) {
  const maxInvoices = usage.limits.maxInvoicesPerMonth ?? 25
  const maxQuotes = usage.limits.maxQuotesPerMonth ?? 10
  const maxEmails = usage.limits.maxEmailsPerMonth ?? 20
  const resetLabel = formatResetDate(usage.billingPeriod?.resetsAt)
  const anyLimit = usage.atLimit || usage.atQuoteLimit || usage.atEmailLimit

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
          Quotas mensuels — plan Free
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Compteurs remis à zéro le 1er de chaque mois
          {resetLabel ? ` (prochain reset : ${resetLabel})` : ''}.
        </Typography>

        {anyLimit && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Un ou plusieurs quotas sont atteints. Passez au plan Pro pour un usage illimité, ou attendez le
            prochain reset mensuel.
          </Alert>
        )}

        <QuotaRow
          label="Factures créées"
          used={usage.usage.invoicesThisMonth}
          max={maxInvoices}
          atLimit={usage.atLimit}
        />
        <QuotaRow
          label="Devis créés"
          used={usage.usage.quotesThisMonth}
          max={maxQuotes}
          atLimit={usage.atQuoteLimit}
        />
        <QuotaRow
          label="Emails envoyés"
          used={usage.usage.emailsSentThisMonth}
          max={maxEmails}
          atLimit={usage.atEmailLimit}
        />

        {usage.limits.pdfWatermark && (
          <Alert severity="info" sx={{ mb: showUpgradeCta ? 2 : 0 }}>
            Les PDF factures et devis incluent un filigrane « PrestaFacture » sur le plan Free.
          </Alert>
        )}

        {showUpgradeCta && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Button variant="contained" component={RouterLink} to="/parametres/abonnement">
              Passer au plan Pro
            </Button>
            <Button variant="outlined" component={RouterLink} to="/tarifs">
              Voir les offres
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

type QuotaUsagePanelSkeletonProps = {
  loading?: boolean
}

/** Skeleton de chargement pour le panneau quotas. */
export function QuotaUsagePanelSkeleton({ loading = true }: QuotaUsagePanelSkeletonProps) {
  if (!loading) return null
  return <Skeleton variant="rounded" height={320} sx={{ borderRadius: 2 }} />
}

/**
 * Indique si un quota Free approche ou dépasse le seuil d'alerte (80 % ou 100 %).
 */
export function hasQuotaAlert(usage: BillingUsage): boolean {
  if (usage.plan !== 'FREE') return false
  if (usage.atLimit || usage.atQuoteLimit || usage.atEmailLimit) return true

  const checks = [
    { used: usage.usage.invoicesThisMonth, max: usage.limits.maxInvoicesPerMonth },
    { used: usage.usage.quotesThisMonth, max: usage.limits.maxQuotesPerMonth },
    { used: usage.usage.emailsSentThisMonth, max: usage.limits.maxEmailsPerMonth },
  ]

  return checks.some(({ used, max }) => max != null && max > 0 && (used / max) * 100 >= QUOTA_WARN_PCT)
}
