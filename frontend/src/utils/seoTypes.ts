export type RobotsDirective = 'index, follow' | 'noindex, nofollow' | 'noindex, follow'

export type SeoPayload = {
  /** Titre court (suffixe marque optionnel via VITE_APP_NAME) */
  title: string
  description: string
  robots?: RobotsDirective
  ogType?: 'website' | 'article'
  /** Chemin relatif ou URL absolue de l'image Open Graph (1200×630 recommandé) */
  ogImage?: string
  /** Texte alternatif de l'image OG (accessibilité + crawlers sociaux) */
  ogImageAlt?: string
  keywords?: string
  /** Chemin pour canonical (ex. /tarifs) — défaut : pathname courant */
  canonicalPath?: string
}

export type SeoOverrides = Partial<SeoPayload>
