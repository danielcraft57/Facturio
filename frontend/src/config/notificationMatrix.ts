import type { Notification } from '../stores/appStore'

/** Segment utilisateur cible pour une notification lifecycle. */
export type NotificationSegment = 'all' | 'demo' | 'free' | 'beta' | 'account'

/** Canal de diffusion : toast éphémère, centre d'activité, ou les deux. */
export type NotificationChannel = 'toast' | 'center' | 'both'

export type NotificationMatrixEventId =
  | 'demo-blocked'
  | 'quota-api-block'
  | 'quota-batch-limit'
  | 'quota-batch-warn'
  | 'beta-lifecycle'
  | 'onboarding-installed'
  | 'invoice-created'
  | 'quote-created'
  | 'client-created'
  | 'product-price-updated'

/** Règle de la matrice : quoi, quand, 1 CTA, segment. */
export type NotificationMatrixRule = {
  id: NotificationMatrixEventId
  segment: NotificationSegment
  channel: NotificationChannel
  category: NonNullable<Notification['category']>
  defaultType: Notification['type']
  /** Libellé CTA unique (roadmap : 1 CTA). */
  ctaLabel?: string
  ctaHref?: string
}

/**
 * Matrice des notifications lifecycle et activité métier.
 * Source de vérité pour segment, canal et CTA.
 */
export const NOTIFICATION_MATRIX: Record<NotificationMatrixEventId, NotificationMatrixRule> = {
  'demo-blocked': {
    id: 'demo-blocked',
    segment: 'demo',
    channel: 'toast',
    category: 'system',
    defaultType: 'info',
    ctaLabel: 'Inscription gratuite',
    ctaHref: '/signup',
  },
  'quota-api-block': {
    id: 'quota-api-block',
    segment: 'free',
    channel: 'both',
    category: 'system',
    defaultType: 'warning',
    ctaLabel: 'Voir les quotas',
    ctaHref: '/parametres/quotas',
  },
  'quota-batch-limit': {
    id: 'quota-batch-limit',
    segment: 'free',
    channel: 'both',
    category: 'system',
    defaultType: 'error',
    ctaLabel: 'Voir les quotas',
    ctaHref: '/parametres/quotas',
  },
  'quota-batch-warn': {
    id: 'quota-batch-warn',
    segment: 'free',
    channel: 'both',
    category: 'system',
    defaultType: 'warning',
    ctaLabel: 'Détails',
    ctaHref: '/parametres/quotas',
  },
  'beta-lifecycle': {
    id: 'beta-lifecycle',
    segment: 'beta',
    channel: 'both',
    category: 'system',
    defaultType: 'warning',
    ctaLabel: 'Mon abonnement',
    ctaHref: '/parametres/abonnement',
  },
  'onboarding-installed': {
    id: 'onboarding-installed',
    segment: 'account',
    channel: 'both',
    category: 'product',
    defaultType: 'success',
    ctaLabel: 'Mon catalogue',
    ctaHref: '/produits',
  },
  'invoice-created': {
    id: 'invoice-created',
    segment: 'account',
    channel: 'center',
    category: 'invoice',
    defaultType: 'success',
    ctaLabel: 'Voir la facture',
  },
  'quote-created': {
    id: 'quote-created',
    segment: 'account',
    channel: 'center',
    category: 'quote',
    defaultType: 'success',
    ctaLabel: 'Voir le devis',
  },
  'client-created': {
    id: 'client-created',
    segment: 'account',
    channel: 'center',
    category: 'client',
    defaultType: 'success',
    ctaLabel: 'Créer une facture',
  },
  'product-price-updated': {
    id: 'product-price-updated',
    segment: 'account',
    channel: 'center',
    category: 'product',
    defaultType: 'info',
    ctaLabel: 'Voir le catalogue',
    ctaHref: '/produits',
  },
}

/**
 * Retourne la règle matrice pour un événement.
 *
 * @param eventId - Identifiant d'événement
 */
export function getNotificationMatrixRule(eventId: NotificationMatrixEventId): NotificationMatrixRule {
  return NOTIFICATION_MATRIX[eventId]
}
