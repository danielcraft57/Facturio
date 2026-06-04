/** Stub Metro web : évite le chargement du module natif expo-notifications dans le bundle web. */

export function setNotificationHandler() {}

export async function getPermissionsAsync() {
  return { status: 'denied' as const }
}

export async function requestPermissionsAsync() {
  return { status: 'denied' as const }
}

export async function getExpoPushTokenAsync() {
  return { data: '' }
}

export async function scheduleNotificationAsync() {}
