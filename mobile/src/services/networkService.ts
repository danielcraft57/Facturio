import NetInfo, { type NetInfoSubscription } from '@react-native-community/netinfo'

type NetworkListener = (online: boolean) => void

let currentOnline = true
const listeners = new Set<NetworkListener>()
let unsubscribe: NetInfoSubscription | null = null

export function startNetworkWatcher() {
  if (unsubscribe) return
  unsubscribe = NetInfo.addEventListener((state) => {
    const online = !!state.isConnected && !!state.isInternetReachable
    currentOnline = online
    listeners.forEach((l) => l(online))
  })
}

export function stopNetworkWatcher() {
  unsubscribe?.()
  unsubscribe = null
}

export function isOnline() {
  return currentOnline
}

export function onNetworkChange(listener: NetworkListener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
