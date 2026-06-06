import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initGoogleAnalytics, trackGoogleAnalyticsPageView } from '../utils/googleAnalytics'

/**
 * GA4 global : une seule intégration au niveau du routeur couvre toutes les routes
 * (marketing, auth, app connectée, pages client publiques, etc.).
 */
export function GoogleAnalytics() {
  const location = useLocation()

  useEffect(() => {
    initGoogleAnalytics()
  }, [])

  useEffect(() => {
    const pagePath = `${location.pathname}${location.search}${location.hash}`
    trackGoogleAnalyticsPageView(pagePath)
  }, [location.pathname, location.search, location.hash])

  return null
}
