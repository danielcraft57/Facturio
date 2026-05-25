import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { applySeo } from '../utils/applySeo'
import { seoForRoute } from '../utils/seoForRoute'
import { useSeoOverrideStore } from '../stores/seoOverrideStore'

/**
 * SEO global par route (titre, description, OG, Twitter, canonical, robots).
 * Les pages peuvent surcharger via usePageTitle / useSeo.
 */
export function SeoManager() {
  const { pathname } = useLocation()
  const override = useSeoOverrideStore((s) => s.override)

  useEffect(() => {
    applySeo({ ...seoForRoute(pathname), ...override }, pathname)
  }, [pathname, override])

  return null
}
