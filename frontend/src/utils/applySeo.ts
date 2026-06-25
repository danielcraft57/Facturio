import {
  DEFAULT_OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_TYPE,
  OG_IMAGE_WIDTH,
  SEO_BRAND_NAME,
  SITE_LOCALE,
  absoluteUrl,
  getSiteBrandName,
  getSiteOrigin,
} from '../config/seo'
import type { SeoPayload } from './seoTypes'

const MANAGED = 'data-app-seo'

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  if (!content) return
  const selector = `meta[${attribute}="${key}"][${MANAGED}]`
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attribute, key)
    el.setAttribute(MANAGED, 'true')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function removeManagedMeta(attribute: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attribute}="${key}"][${MANAGED}]`)?.remove()
}

function upsertLink(rel: string, href: string) {
  if (!href) return
  const selector = `link[rel="${rel}"][${MANAGED}]`
  let el = document.head.querySelector(selector) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    el.setAttribute(MANAGED, 'true')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function formatPageTitle(pageTitle: string, brandName = getSiteBrandName()): string {
  const trimmed = (pageTitle || 'Accueil').trim()
  if (!brandName) return trimmed
  if (trimmed === brandName) return brandName
  return `${trimmed} — ${brandName}`
}

/** Applique titre, description, canonical, Open Graph et Twitter Card. */
export function applySeo(meta: SeoPayload, pathname?: string) {
  const path = meta.canonicalPath ?? pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
  const brandName = getSiteBrandName()
  const canonical = absoluteUrl(path)
  const pageTitle = formatPageTitle(meta.title, brandName)
  const ogImage = absoluteUrl(meta.ogImage ?? '/images/facturio-hero.jpg')
  const ogImageAlt = meta.ogImageAlt ?? DEFAULT_OG_IMAGE_ALT
  const origin = getSiteOrigin() || (typeof window !== 'undefined' ? window.location.origin : '')

  document.title = pageTitle
  document.documentElement.lang = 'fr'

  upsertMeta('name', 'description', meta.description)
  upsertMeta('name', 'robots', meta.robots ?? 'index, follow')
  if (meta.keywords) upsertMeta('name', 'keywords', meta.keywords)

  if (brandName) {
    upsertMeta('property', 'og:site_name', brandName)
    upsertMeta('name', 'application-name', brandName)
  } else {
    removeManagedMeta('property', 'og:site_name')
    removeManagedMeta('name', 'application-name')
  }

  upsertMeta('property', 'og:locale', SITE_LOCALE)
  upsertMeta('property', 'og:type', meta.ogType ?? 'website')
  upsertMeta('property', 'og:title', pageTitle)
  upsertMeta('property', 'og:description', meta.description)
  upsertMeta('property', 'og:url', canonical)
  upsertMeta('property', 'og:image', ogImage)
  upsertMeta('property', 'og:image:width', String(OG_IMAGE_WIDTH))
  upsertMeta('property', 'og:image:height', String(OG_IMAGE_HEIGHT))
  upsertMeta('property', 'og:image:type', OG_IMAGE_TYPE)
  upsertMeta('property', 'og:image:alt', ogImageAlt)

  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:url', canonical)
  upsertMeta('name', 'twitter:title', pageTitle)
  upsertMeta('name', 'twitter:description', meta.description)
  upsertMeta('name', 'twitter:image', ogImage)
  upsertMeta('name', 'twitter:image:alt', ogImageAlt)

  upsertLink('canonical', canonical)

  upsertMeta('name', 'theme-color', '#0f766e')

  const jsonLdId = 'app-jsonld'
  let script = document.getElementById(jsonLdId) as HTMLScriptElement | null
  if (path === '/') {
    if (!script) {
      script = document.createElement('script')
      script.id = jsonLdId
      script.type = 'application/ld+json'
      script.setAttribute(MANAGED, 'true')
      document.head.appendChild(script)
    }
    const appLabel = brandName || SEO_BRAND_NAME
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: appLabel,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      ...(origin ? { url: origin } : {}),
      description: meta.description,
      audience: {
        '@type': 'Audience',
        audienceType: 'Freelances, studios et petites équipes du digital',
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Essai gratuit — 25 factures par mois',
      },
    })
  } else if (script) {
    script.remove()
  }
}
