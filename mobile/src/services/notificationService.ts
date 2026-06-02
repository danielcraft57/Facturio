import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

export async function prepareNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null
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
  if (Platform.OS === 'web') return
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data as any },
    trigger: null,
  })
}
