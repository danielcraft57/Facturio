import { Platform } from 'react-native'

type NetworkListener = (online: boolean) => void

let currentOnline = true
const listeners = new Set<NetworkListener>()
let removeNetInfoListener: (() => void) | null = null
let removeWebListeners: (() => void) | null = null

export function readNavigatorOnline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine
  }
  return true
}

function setOnline(online: boolean) {
  if (online === currentOnline) return
  currentOnline = online
  listeners.forEach((l) => l(online))
}

async function ensureNetInfoWatcher() {
  if (removeNetInfoListener || Platform.OS === 'web') return
  const { default: NetInfo } = await import('@react-native-community/netinfo')
  removeNetInfoListener = NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected && (state.isInternetReachable ?? true))
  })
}

function ensureWebNetworkWatcher() {
  if (removeWebListeners || Platform.OS !== 'web' || typeof window === 'undefined') return

  const onBrowserNetworkChange = () => setOnline(readNavigatorOnline())

  currentOnline = readNavigatorOnline()
  window.addEventListener('online', onBrowserNetworkChange)
  window.addEventListener('offline', onBrowserNetworkChange)
  removeWebListeners = () => {
    window.removeEventListener('online', onBrowserNetworkChange)
    window.removeEventListener('offline', onBrowserNetworkChange)
    removeWebListeners = null
  }
}

export function startNetworkWatcher() {
  if (Platform.OS === 'web') {
    ensureWebNetworkWatcher()
    return
  }
  void ensureNetInfoWatcher()
}

export function stopNetworkWatcher() {
  removeWebListeners?.()
  removeNetInfoListener?.()
  removeNetInfoListener = null
}

export function isOnline() {
  if (Platform.OS === 'web') {
    return readNavigatorOnline()
  }
  return currentOnline
}

export function onNetworkChange(listener: NetworkListener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Réinitialise l'état interne (tests uniquement). */
export function __resetNetworkServiceForTests() {
  listeners.clear()
  removeWebListeners?.()
  removeNetInfoListener?.()
  removeWebListeners = null
  removeNetInfoListener = null
  currentOnline = true
}
