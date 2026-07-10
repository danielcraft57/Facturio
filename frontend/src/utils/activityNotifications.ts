import {
  getNotificationMatrixRule,
  type NotificationMatrixEventId,
} from '../config/notificationMatrix'
import { useAppStore, type Notification } from '../stores/appStore'

type PushActivityParams = {
  title: string
  message: string
  type?: Notification['type']
  href?: string
}

/**
 * Enregistre une notification dans le centre d'activité selon la matrice.
 *
 * @param eventId - Événement matrice
 * @param params - Titre, message et lien optionnel (surcharge le CTA par défaut)
 */
export function pushActivityNotification(
  eventId: NotificationMatrixEventId,
  params: PushActivityParams,
): void {
  const rule = getNotificationMatrixRule(eventId)
  if (rule.channel === 'toast') return

  const href = params.href ?? rule.ctaHref

  useAppStore.getState().addNotification({
    type: params.type ?? rule.defaultType,
    title: params.title,
    message: params.message,
    category: rule.category,
    href,
  })
}
