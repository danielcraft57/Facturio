import { Platform } from 'react-native'
import * as Application from 'expo-application'
import { apiClient } from './apiClient'

export async function registerPushToken(expoPushToken: string) {
  const platform: 'android' | 'ios' | 'web' =
    Platform.OS === 'android' ? 'android' : Platform.OS === 'ios' ? 'ios' : 'web'

  return apiClient.post('/mobile-notifications/devices', {
    expoPushToken,
    platform,
    deviceName: Application.applicationName ?? undefined,
    appVersion: Application.nativeApplicationVersion ?? undefined,
  })
}
