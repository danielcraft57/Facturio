import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'user'
const FINGERPRINT_KEY = 'device_fingerprint'

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key)
  }
  return SecureStore.getItemAsync(key)
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key)
    return
  }
  await SecureStore.deleteItemAsync(key)
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
}

export async function getDeviceFingerprint(): Promise<string> {
  const existing = await storageGet(FINGERPRINT_KEY)
  if (existing) return existing
  const fp = `mobile-${randomId()}`
  await storageSet(FINGERPRINT_KEY, fp)
  return fp
}

export async function getAuthToken(): Promise<string | null> {
  return storageGet(TOKEN_KEY)
}

export async function setAuthSession(token: string, userJson: string): Promise<void> {
  await storageSet(TOKEN_KEY, token)
  await storageSet(USER_KEY, userJson)
}

export async function clearAuthSession(): Promise<void> {
  await storageDelete(TOKEN_KEY)
  await storageDelete(USER_KEY)
}

export async function getStoredUserJson(): Promise<string | null> {
  return storageGet(USER_KEY)
}
