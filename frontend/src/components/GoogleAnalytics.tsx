import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { isGoogleAnalyticsDevBypassConsent } from '../config/analytics'
import { useAuthStore } from '../stores/authStore'
import {
  ANALYTICS_CONSENT_EVENT,
  GA_READY_EVENT,
  hasAnalyticsConsent,
} from '../utils/cookieConsent'
import {
  grantGoogleAnalyticsConsent,
  initGoogleAnalytics,
  setGoogleAnalyticsUserId,
  trackGoogleAnalyticsPageView,
} from '../utils/googleAnalytics'

function trackingAllowedInitially(): boolean {
  return hasAnalyticsConsent() || isGoogleAnalyticsDevBypassConsent()
}

export function GoogleAnalytics() {
  const location = useLocation()
  const userId = useAuthStore((state) => state.user?.id)
  const [allowed, setAllowed] = useState(trackingAllowedInitially)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initGoogleAnalytics()
    const onReady = () => setReady(true)
    const onConsent = () => {
      grantGoogleAnalyticsConsent()
      setAllowed(true)
    }
    if (trackingAllowedInitially()) {
      grantGoogleAnalyticsConsent()
      setAllowed(true)
    }
    window.addEventListener(GA_READY_EVENT, onReady)
    window.addEventListener(ANALYTICS_CONSENT_EVENT, onConsent)
    return () => {
      window.removeEventListener(GA_READY_EVENT, onReady)
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, onConsent)
    }
  }, [])

  useEffect(() => {
    setGoogleAnalyticsUserId(userId)
  }, [userId, allowed, ready])

  useEffect(() => {
    if (!allowed || !ready) return
    trackGoogleAnalyticsPageView(`${location.pathname}${location.search}${location.hash}`)
  }, [allowed, ready, location.pathname, location.search, location.hash])

  return null
}
