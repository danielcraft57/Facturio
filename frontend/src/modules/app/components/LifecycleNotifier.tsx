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
import { pushActivityNotification } from '../../../utils/activityNotifications'
import { getNotificationMatrixRule } from '../../../config/notificationMatrix'

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
      const message =
        detail?.message ??
        'Cette action nécessite votre compte. Vous pouvez continuer à explorer les exemples.'
      const title =
        detail?.code === 'DEMO_EMAIL_BLOCKED'
          ? 'Envoi désactivé en démo'
          : detail?.code === 'DEMO_READ_ONLY'
            ? 'Création réservée à votre compte'
            : 'Mode démo'

      toast.info(message, {
        title,
        duration: 10000,
        action: (
          <Button component={RouterLink} to={getNotificationMatrixRule('demo-blocked').ctaHref!} size="small" color="inherit" variant="outlined">
            {getNotificationMatrixRule('demo-blocked').ctaLabel}
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
          <Button component={RouterLink} to={getNotificationMatrixRule('quota-api-block').ctaHref!} size="small" color="inherit">
            {getNotificationMatrixRule('quota-api-block').ctaLabel}
          </Button>
        ),
      })
      pushActivityNotification('quota-api-block', {
        title: 'Quota atteint',
        message,
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
          <Button component={RouterLink} to={getNotificationMatrixRule('onboarding-installed').ctaHref!} size="small" color="inherit">
            {getNotificationMatrixRule('onboarding-installed').ctaLabel}
          </Button>
        ),
      })
      pushActivityNotification('onboarding-installed', {
        title: copy.title,
        message: copy.message,
      })
    }

    window.addEventListener(ONBOARDING_INSTALLED_EVENT, handler)
    return () => window.removeEventListener(ONBOARDING_INSTALLED_EVENT, handler)
  }, [toast, userId])

  useEffect(() => {
    if (!usage || usage.plan !== 'FREE' || !userId) return

    const maxInv = usage.limits.maxInvoicesPerMonth ?? 25
    const maxQuotes = usage.limits.maxQuotesPerMonth ?? 10
    const maxEmails = usage.limits.maxEmailsPerMonth ?? 20

    const invPct = maxInv > 0 ? (usage.usage.invoicesThisMonth / maxInv) * 100 : 0
    const quotePct = maxQuotes > 0 ? (usage.usage.quotesThisMonth / maxQuotes) * 100 : 0
    const emailPct = maxEmails > 0 ? (usage.usage.emailsSentThisMonth / maxEmails) * 100 : 0

    const atLimitLabels: string[] = []
    const warnLabels: string[] = []

    if (usage.atLimit) atLimitLabels.push('factures')
    else if (invPct >= 80) warnLabels.push('factures')

    if (usage.atQuoteLimit) atLimitLabels.push('devis')
    else if (quotePct >= 80 && !usage.atQuoteLimit) warnLabels.push('devis')

    if (usage.atEmailLimit) atLimitLabels.push('emails')
    else if (emailPct >= 80 && !usage.atEmailLimit) warnLabels.push('emails')

    if (atLimitLabels.length === 0 && warnLabels.length === 0) return

    const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

    if (atLimitLabels.length > 0) {
      const kind = `quota-batch-limit-${monthKey}`
      if (wasQuotaToastShown(kind)) return
      markQuotaToastShown(kind)
      toast.error(
        `Quotas atteints ce mois-ci : ${atLimitLabels.join(', ')}. Passez au Pro ou attendez le 1er du mois prochain.`,
        {
          title: 'Quota atteint',
          duration: 12_000,
          action: (
            <Button component={RouterLink} to={getNotificationMatrixRule('quota-batch-limit').ctaHref!} size="small" color="inherit">
              {getNotificationMatrixRule('quota-batch-limit').ctaLabel}
            </Button>
          ),
        },
      )
      pushActivityNotification('quota-batch-limit', {
        title: 'Quota atteint',
        message: `Quotas atteints : ${atLimitLabels.join(', ')}.`,
      })
      return
    }

    const kind = `quota-batch-warn-${monthKey}`
    if (wasQuotaToastShown(kind)) return
    markQuotaToastShown(kind)
    toast.warning(
      `Vous approchez des quotas Free : ${warnLabels.join(', ')}.`,
      {
        title: 'Quota bientôt atteint',
        duration: 9000,
        action: (
          <Button component={RouterLink} to={getNotificationMatrixRule('quota-batch-warn').ctaHref!} size="small" color="inherit">
            {getNotificationMatrixRule('quota-batch-warn').ctaLabel}
          </Button>
        ),
      },
    )
    pushActivityNotification('quota-batch-warn', {
      title: 'Quota bientôt atteint',
      message: `Proche des limites : ${warnLabels.join(', ')}.`,
    })
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
        <Button component={RouterLink} to={getNotificationMatrixRule('beta-lifecycle').ctaHref!} size="small" color="inherit">
          {phase === 'expired' ? 'Passer Pro' : getNotificationMatrixRule('beta-lifecycle').ctaLabel}
        </Button>
      ),
    })
    pushActivityNotification('beta-lifecycle', {
      title: copy.title,
      message: copy.message,
      type: copy.severity === 'error' ? 'error' : copy.severity === 'warning' ? 'warning' : 'info',
    })
  }, [usage?.betaTester, userId, toast])

  return null
}
