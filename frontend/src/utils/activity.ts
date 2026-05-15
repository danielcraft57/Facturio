import { useAppStore, type Notification } from '../stores/appStore'

export type ActivityCategory = 'invoice' | 'quote' | 'client' | 'payment' | 'system'

export function logActivity(
  payload: Omit<Notification, 'id' | 'timestamp' | 'read'> & {
    category?: ActivityCategory
    href?: string
  }
) {
  useAppStore.getState().addNotification({
    ...payload,
    duration: undefined,
    category: payload.category,
    href: payload.href,
  })
}
