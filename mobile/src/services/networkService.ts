import { Platform } from 'react-native'

type NetworkListener = (online: boolean) => void

let currentOnline = true
const listeners = new Set<NetworkListener>()
let removeNetInfoListener: (() => void) | null = null

async function ensureNetInfoWatcher() {
  if (removeNetInfoListener || Platform.OS === 'web') return
  const { default: NetInfo } = await import('@react-native-community/netinfo')
  removeNetInfoListener = NetInfo.addEventListener((state) => {
    const online = !!state.isConnected && (state.isInternetReachable ?? true)
    currentOnline = online
    listeners.forEach((l) => l(online))
  })
}

export function startNetworkWatcher() {
  if (Platform.OS === 'web') return
  void ensureNetInfoWatcher()
}

export function stopNetworkWatcher() {
  removeNetInfoListener?.()
  removeNetInfoListener = null
}

export function isOnline() {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    return navigator.onLine
  }
  return currentOnline
}

export function onNetworkChange(listener: NetworkListener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
