import { usePathname } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { APP_NAME, titleForPath } from '../constants/appMetadata'

/** Met à jour l’onglet navigateur en mode web (`document.title`). */
export function useDocumentTitle(override?: string) {
  const pathname = usePathname()
  const pageTitle = override ?? titleForPath(pathname)

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return
    document.title = pageTitle === APP_NAME ? APP_NAME : `${pageTitle} · ${APP_NAME}`
  }, [pageTitle])
}
