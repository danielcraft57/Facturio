import {
  GA_MEASUREMENT_ID,
  getGoogleAnalyticsConfigOptions,
  isGoogleAnalyticsDevBypassConsent,
  isGoogleAnalyticsEnabled,
} from '../config/analytics'
import { GA_READY_EVENT, hasAnalyticsConsent } from './cookieConsent'

type GtagFn = {
  (...args: unknown[]): void
  // Signature officielle Google : dataLayer.push(arguments)
}

declare global {
  interface Window {
    dataLayer?: IArguments[]
    gtag?: GtagFn
  }
}

let initialized = false
let scriptLoaded = false
let consentGranted = false

/** Stub gtag identique au snippet Google (push arguments, pas un tableau). */
function ensureGtagStub(): void {
  window.dataLayer = window.dataLayer ?? []
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params -- snippet Google : push(arguments), pas un tableau
      window.dataLayer!.push(arguments)
    } as GtagFn
  }
}

function setDefaultConsentMode(): void {
  ensureGtagStub()
  window.gtag!('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500,
  })
}

function shouldGrantConsent(): boolean {
  return hasAnalyticsConsent() || isGoogleAnalyticsDevBypassConsent()
}

function notifyReady(): void {
  window.dispatchEvent(new Event(GA_READY_EVENT))
}

function finishInit(): void {
  window.gtag!('config', GA_MEASUREMENT_ID, getGoogleAnalyticsConfigOptions())
  if (shouldGrantConsent()) {
    grantGoogleAnalyticsConsent()
  }
  notifyReady()
}

export function grantGoogleAnalyticsConsent(): void {
  if (!isGoogleAnalyticsEnabled() || consentGranted) return
  consentGranted = true
  ensureGtagStub()
  window.gtag!('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
  })
  notifyReady()
}

function loadGtagScript(onReady: () => void): void {
  const selector = `script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`
  const existing = document.querySelector(selector) as HTMLScriptElement | null
  if (existing) {
    if (scriptLoaded) {
      onReady()
      return
    }
    existing.addEventListener('load', onReady, { once: true })
    return
  }
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  script.onload = () => {
    scriptLoaded = true
    onReady()
  }
  script.onerror = () => {
    console.error(
      `[GA4] ID invalide : ${GA_MEASUREMENT_ID} (gtag/js → 404). Vérifiez Admin GA4 → Flux de données.`,
    )
  }
  document.head.appendChild(script)
}

export function initGoogleAnalytics(): void {
  if (!isGoogleAnalyticsEnabled() || initialized || typeof window === 'undefined') return
  initialized = true
  setDefaultConsentMode()
  window.gtag!('js', new Date())
  loadGtagScript(finishInit)
}

function canSendHits(): boolean {
  return isGoogleAnalyticsEnabled() && initialized && scriptLoaded && consentGranted
}

export function setGoogleAnalyticsUserId(userId: string | null | undefined): void {
  if (!canSendHits() || !window.gtag) return
  window.gtag('config', GA_MEASUREMENT_ID, { user_id: userId ?? undefined })
}

export function trackGoogleAnalyticsPageView(pagePath: string): void {
  if (!canSendHits() || !window.gtag) return
  const pageView = {
    page_path: pagePath,
    page_title: document.title,
    page_location: window.location.href,
  }
  window.gtag('config', GA_MEASUREMENT_ID, {
    ...getGoogleAnalyticsConfigOptions(),
    ...pageView,
  })
  window.gtag('event', 'page_view', pageView)
}

export function trackGoogleAnalyticsEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  if (!canSendHits() || !window.gtag) return
  const cleaned = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
      )
    : undefined
  window.gtag('event', eventName, cleaned)
}

export function resetGoogleAnalyticsForTests(): void {
  initialized = false
  scriptLoaded = false
  consentGranted = false
}
