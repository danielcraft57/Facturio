import { useEffect, useState } from 'react'
import { Platform } from 'react-native'

/** Statut réseau sans import statique de NetInfo (compatible SSR web Expo). */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    if (Platform.OS === 'web') {
      const update = () => {
        setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
      }
      update()
      window.addEventListener('online', update)
      window.addEventListener('offline', update)
      return () => {
        window.removeEventListener('online', update)
        window.removeEventListener('offline', update)
      }
    }

    let remove: (() => void) | undefined
    void import('@react-native-community/netinfo').then((mod) => {
      remove = mod.default.addEventListener((state) => {
        setOnline(!!state.isConnected && (state.isInternetReachable ?? true))
      })
    })

    return () => remove?.()
  }, [])

  return online
}
