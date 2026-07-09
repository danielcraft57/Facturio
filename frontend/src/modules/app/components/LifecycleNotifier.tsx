import { useEffect } from 'react'
import { Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useToast } from '../../../components/useToast'
import { useAuthStore } from '../../../stores/authStore'
import { useBillingUsage, invalidateBillingUsageCache } from '../../../hooks/useBillingUsage'
import {
  QUOTA_EXCEEDED_EVENT,
  DEMO_BLOCKED_EVENT,
  ONBOARDING_INSTALLED_EVENT,
  type QuotaExceededDetail,
  type DemoBlockedDetail,
  type OnboardingInstalledDetail,
  wasLifecycleNoticeShown,
  markLifecycleNoticeShown,
  wasQuotaToastShown,
  markQuotaToastShown,
  resolveBetaLifecyclePhase,
  betaLifecycleNoticeCopy,
  onboardingInstalledNoticeCopy,
} from '../../../utils/lifecycleNotifications'

type QuotaKind = 'invoices' | 'quotes' | 'emails'

/**
 * Toasts lifecycle : quotas Free, jalons beta, installation catalogue.
 */
export function LifecycleNotifier() {
  const toast = useToast()
  const user = useAuthStore((s) => s.user)
  const { usage } = useBillingUsage()
  const userId = user?.id

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<DemoBlockedDetail>).detail
      const message = detail?.message ?? 'Action désactivée en mode démo.'
      const title = detail?.code === 'DEMO_EMAIL_BLOCKED' ? 'Envoi désactivé' : 'Mode démo'

      toast.info(message, {
        title,
        duration: 10000,
        action: (
          <Button component={RouterLink} to="/signup" size="small" color="inherit">
            Créer un compte
          </Button>
        ),
      })
    }

    window.addEventListener(DEMO_BLOCKED_EVENT, handler)
    return () => window.removeEventListener(DEMO_BLOCKED_EVENT, handler)
  }, [toast])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<QuotaExceededDetail>).detail
      const message = detail?.message ?? 'Quota mensuel atteint sur le plan Free.'
      if (wasQuotaToastShown('api-block')) return
      markQuotaToastShown('api-block')
      invalidateBillingUsageCache()

      toast.warning(message, {
        title: 'Quota atteint',
        duration: 12000,
        action: (
          <Button component={RouterLink} to="/parametres/quotas" size="small" color="inherit">
            Voir les quotas
          </Button>
        ),
      })
    }

    window.addEventListener(QUOTA_EXCEEDED_EVENT, handler)
    return () => window.removeEventListener(QUOTA_EXCEEDED_EVENT, handler)
  }, [toast])

  useEffect(() => {
    const handler = (event: Event) => {
      if (!userId) return
      const detail = (event as CustomEvent<OnboardingInstalledDetail>).detail
      const count = detail?.productCount ?? 0
      if (count <= 0) return
      const kind = 'onboarding-installed'
      if (wasLifecycleNoticeShown(userId, kind)) return
      markLifecycleNoticeShown(userId, kind)

      const copy = onboardingInstalledNoticeCopy(count)
      toast.success(copy.message, {
        title: copy.title,
        duration: 11000,
        action: (
          <Button component={RouterLink} to="/produits" size="small" color="inherit">
            Mon catalogue
          </Button>
        ),
      })
    }

    window.addEventListener(ONBOARDING_INSTALLED_EVENT, handler)
    return () => window.removeEventListener(ONBOARDING_INSTALLED_EVENT, handler)
  }, [toast, userId])

  useEffect(() => {
    if (!usage || usage.plan !== 'FREE' || !userId) return

    const notify = (kind: QuotaKind, atLimit: boolean, nearLimit: boolean, label: string) => {
      if (!atLimit && !nearLimit) return
      const toastKind = atLimit ? `${kind}-limit` : `${kind}-warn`
      if (wasQuotaToastShown(toastKind)) return
      markQuotaToastShown(toastKind)

      const fn = atLimit ? toast.error : toast.warning
      fn(
        atLimit
          ? `Quota ${label} atteint ce mois-ci. Passez au Pro ou attendez le 1er du mois prochain.`
          : `Vous approchez du quota ${label} sur le plan Free.`,
        {
          title: atLimit ? 'Quota atteint' : 'Quota bientôt atteint',
          duration: atLimit ? 12000 : 9000,
          action: (
            <Button component={RouterLink} to="/parametres/quotas" size="small" color="inherit">
              Détails
            </Button>
          ),
        },
      )
    }

    const maxInv = usage.limits.maxInvoicesPerMonth ?? 25
    const maxQuotes = usage.limits.maxQuotesPerMonth ?? 10
    const maxEmails = usage.limits.maxEmailsPerMonth ?? 20

    const invPct = maxInv > 0 ? (usage.usage.invoicesThisMonth / maxInv) * 100 : 0
    const quotePct = maxQuotes > 0 ? (usage.usage.quotesThisMonth / maxQuotes) * 100 : 0
    const emailPct = maxEmails > 0 ? (usage.usage.emailsSentThisMonth / maxEmails) * 100 : 0

    notify('invoices', usage.atLimit, invPct >= 80 && !usage.atLimit, 'factures')
    notify('quotes', usage.atQuoteLimit, quotePct >= 80 && !usage.atQuoteLimit, 'devis')
    notify('emails', usage.atEmailLimit, emailPct >= 80 && !usage.atEmailLimit, 'emails')
  }, [usage, toast, userId])

  useEffect(() => {
    if (!userId || !usage?.betaTester) return

    const phase = resolveBetaLifecyclePhase(usage.betaTester)
    if (!phase) return

    const kind = `beta-${phase}`
    if (wasLifecycleNoticeShown(userId, kind)) return
    markLifecycleNoticeShown(userId, kind)

    const copy = betaLifecycleNoticeCopy(phase)
    const fn = copy.severity === 'error' ? toast.error : copy.severity === 'warning' ? toast.warning : toast.info

    fn(copy.message, {
      title: copy.title,
      duration: phase === 'expired' || phase === '7d' ? 14000 : 11000,
      action: (
        <Button component={RouterLink} to="/parametres/abonnement" size="small" color="inherit">
          {phase === 'expired' ? 'Passer Pro' : 'Mon abonnement'}
        </Button>
      ),
    })
  }, [usage?.betaTester, userId, toast])

  return null
}
