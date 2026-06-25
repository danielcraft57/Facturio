import { useEffect } from 'react'
import { useSeoOverrideStore } from '../stores/seoOverrideStore'
import type { SeoOverrides } from '../utils/seoTypes'

/**
 * Surcharge les métadonnées SEO de la route courante (via SeoManager).
 */
export function useSeo(overrides?: SeoOverrides | null) {
  const setOverride = useSeoOverrideStore((s) => s.setOverride)

  useEffect(() => {
    setOverride(overrides ?? null)
    return () => setOverride(null)
  }, [
    setOverride,
    overrides?.title,
    overrides?.description,
    overrides?.robots,
    overrides?.ogImage,
    overrides?.ogImageAlt,
    overrides?.keywords,
  ])
}
