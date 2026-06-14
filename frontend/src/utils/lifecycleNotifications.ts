import type { BetaTesterStatus } from '../services/billing'

/** Événement navigateur : quota API bloqué. */
export const QUOTA_EXCEEDED_EVENT = 'facturio:quota-exceeded'

/** Événement navigateur : catalogue installé. */
export const ONBOARDING_INSTALLED_EVENT = 'facturio:onboarding-installed'

export type QuotaExceededDetail = { message: string }

export type OnboardingInstalledDetail = { productCount: number }

export type BetaLifecyclePhase = '60d' | '30d' | '7d' | 'expired'

const STORAGE_PREFIX = 'facturio_lifecycle_'

/**
 * Détecte un message d'erreur lié à un quota mensuel Free.
 */
export function isQuotaErrorMessage(message: string | undefined): boolean {
  if (!message) return false
  return /quota/i.test(message)
}

export function dispatchQuotaExceededEvent(message: string): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<QuotaExceededDetail>(QUOTA_EXCEEDED_EVENT, { detail: { message } }),
  )
}

export function dispatchOnboardingInstalledEvent(productCount: number): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<OnboardingInstalledDetail>(ONBOARDING_INSTALLED_EVENT, {
      detail: { productCount },
    }),
  )
}

function lifecycleStorageKey(userId: string | number, kind: string): string {
  return `${STORAGE_PREFIX}${userId}_${kind}`
}

/**
 * Notification lifecycle déjà affichée pour cet utilisateur ?
 */
export function wasLifecycleNoticeShown(userId: string | number, kind: string): boolean {
  try {
    return localStorage.getItem(lifecycleStorageKey(userId, kind)) === '1'
  } catch {
    return true
  }
}

/**
 * Marque une notification lifecycle comme affichée.
 */
export function markLifecycleNoticeShown(userId: string | number, kind: string): void {
  try {
    localStorage.setItem(lifecycleStorageKey(userId, kind), '1')
  } catch {
    /* quota / mode privé */
  }
}

function currentQuotaMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/** @deprecated Préférer wasLifecycleNoticeShown avec kind quota-* */
export function wasQuotaToastShown(kind: string): boolean {
  return wasLifecycleNoticeShown('session', `quota-${kind}-${currentQuotaMonthKey()}`)
}

/** @deprecated Préférer markLifecycleNoticeShown */
export function markQuotaToastShown(kind: string): void {
  markLifecycleNoticeShown('session', `quota-${kind}-${currentQuotaMonthKey()}`)
}

/**
 * Phase beta à notifier (2 mois, 1 mois, 7 jours, expiré).
 *
 * @param beta - Statut beta depuis /billing/usage
 */
export function resolveBetaLifecyclePhase(
  beta: BetaTesterStatus | null | undefined,
): BetaLifecyclePhase | null {
  if (!beta) return null

  if (beta.active && beta.daysRemaining != null) {
    if (beta.daysRemaining <= 0) return 'expired'
    if (beta.daysRemaining <= 7) return '7d'
    if (beta.daysRemaining <= 30) return '30d'
    if (beta.daysRemaining <= 60) return '60d'
    return null
  }

  if (!beta.active && beta.startedAt) return 'expired'
  return null
}

export function betaLifecycleNoticeCopy(phase: BetaLifecyclePhase): {
  title: string
  message: string
  severity: 'warning' | 'error' | 'info'
} {
  switch (phase) {
    case '60d':
      return {
        title: 'Beta — il reste environ 2 mois',
        message:
          'Votre accès complet beta se termine bientôt. Testez compta, API, score conformité et export Factur-X (XML). Connecteur PA : pas encore activé — vos retours comptent.',
        severity: 'info',
      }
    case '30d':
      return {
        title: 'Beta — plus qu\'un mois',
        message:
          'Il vous reste environ 30 jours d\'accès Agence. Pensez à exporter ce dont vous avez besoin avant le retour au plan Free.',
        severity: 'warning',
      }
    case '7d':
      return {
        title: 'Beta — fin dans 7 jours',
        message:
          'Votre période beta se termine très bientôt. Passez Pro si vous voulez garder l\'accès complet sans interruption.',
        severity: 'warning',
      }
    case 'expired':
      return {
        title: 'Période beta terminée',
        message:
          'Votre essai 3 mois est fini : retour au plan Free (quotas mensuels). Passez Pro pour retrouver compta, finance et API.',
        severity: 'error',
      }
  }
}

export function onboardingInstalledNoticeCopy(productCount: number): {
  title: string
  message: string
} {
  return {
    title: 'Catalogue installé',
    message: `${productCount} prestation${productCount > 1 ? 's' : ''} prête${productCount > 1 ? 's' : ''} dans votre compte. Un email récap vous a été envoyé — vous pouvez ajuster les tarifs dans Produits.`,
  }
}
