import { Platform } from 'react-native'

export function usesNativeNotifications(platform: string = Platform.OS): boolean {
  return platform !== 'web'
}

type ExpoNotifications = typeof import('expo-notifications')

let notificationsModule: Promise<ExpoNotifications> | null = null
let handlerConfigured = false

async function loadNotifications(): Promise<ExpoNotifications | null> {
  if (!usesNativeNotifications()) return null
  if (!notificationsModule) {
    notificationsModule = import('expo-notifications')
  }
  const Notifications = await notificationsModule
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    })
    handlerConfigured = true
  }
  return Notifications
}

export async function prepareNotifications(): Promise<string | null> {
  if (!usesNativeNotifications()) return null

  const Notifications = await loadNotifications()
  if (!Notifications) return null

  const Device = await import('expo-device')
  if (!Device.isDevice) return null

  const perms = await Notifications.getPermissionsAsync()
  let finalStatus = perms.status
  if (finalStatus !== 'granted') {
    const req = await Notifications.requestPermissionsAsync()
    finalStatus = req.status
  }
  if (finalStatus !== 'granted') return null

  const token = await Notifications.getExpoPushTokenAsync()
  return token.data
}

export async function pushLocalNotification(title: string, body: string, data?: Record<string, unknown>) {
  if (!usesNativeNotifications()) return

  const Notifications = await loadNotifications()
  if (!Notifications) return

  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data as Record<string, unknown> },
    trigger: null,
  })
}
