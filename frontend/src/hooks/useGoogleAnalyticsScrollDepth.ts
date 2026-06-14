import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { isGoogleAnalyticsEnabled } from '../config/analytics'
import { trackScrollDepth } from '../config/analyticsEvents'

/**
 * Déclenche un événement GA4 quand l'utilisateur atteint certains seuils de scroll.
 * Un seul envoi par seuil et par navigation.
 *
 * @param thresholds - Pourcentages de scroll (défaut : 50 %)
 */
export function useGoogleAnalyticsScrollDepth(thresholds: number[] = [50]): void {
  const location = useLocation()

  useEffect(() => {
    if (!isGoogleAnalyticsEnabled() || typeof window === 'undefined') return

    const fired = new Set<number>()
    const pagePath = `${location.pathname}${location.search}`

    const onScroll = (): void => {
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      if (scrollable <= 0) return

      const percent = Math.round((window.scrollY / scrollable) * 100)
      for (const threshold of thresholds) {
        if (!fired.has(threshold) && percent >= threshold) {
          fired.add(threshold)
          trackScrollDepth(threshold, pagePath)
        }
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [location.pathname, location.search, thresholds])
}
