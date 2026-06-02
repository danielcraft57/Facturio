/** Métadonnées affichage (en-têtes, web, stores). */
export const APP_NAME = 'Facturio'
export const APP_SHORT_NAME = 'Facturio'
export const APP_TAGLINE = 'Facturation simple, rapide et professionnelle'
export const APP_DESCRIPTION =
  'Créez, envoyez et suivez vos factures depuis votre mobile ou tablette.'

export const BRAND = {
  primary: '#002D3D',
  accent: '#00C2A8',
  splash: '#002D3D',
} as const

/** Titres d’écran par segment de route Expo Router */
export const ROUTE_TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/invoices': 'Factures',
  '/quotes': 'Devis',
  '/activity': 'Activité',
  '/clients': 'Clients',
  '/products': 'Produits',
  '/more': 'Paramètres',
  '/login': 'Connexion',
}

export function titleForPath(pathname: string): string {
  if (pathname === '/' || pathname.endsWith('/index') || pathname === '/(app)') {
    return ROUTE_TITLES['/']
  }
  for (const [segment, title] of Object.entries(ROUTE_TITLES)) {
    if (segment !== '/' && pathname.includes(segment)) return title
  }
  return APP_NAME
}
