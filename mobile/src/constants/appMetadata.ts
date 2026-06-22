/** Métadonnées affichage (en-têtes, web, stores). */
export const APP_NAME = 'PrestaFacture'
export const APP_SHORT_NAME = 'PrestaFacture'
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
  '/factures': 'Factures',
  '/devis': 'Devis',
  '/activity': 'Activité',
  '/clients': 'Clients',
  '/products': 'Produits',
  '/more': 'Paramètres',
  '/login': 'Connexion',
}

/** Segments de route Expo (chemins URL en français). */
export const ROUTES = {
  home: '/(app)',
  factures: '/(app)/factures',
  devis: '/(app)/devis',
  factureDetail: (id: string) => `/(app)/factures/${id}` as const,
  devisDetail: (id: string) => `/(app)/devis/${id}` as const,
  clients: '/(app)/clients',
  products: '/(app)/products',
  activity: '/(app)/activity',
  more: '/(app)/more',
  login: '/login',
} as const

export function titleForPath(pathname: string): string {
  if (pathname === '/' || pathname.endsWith('/index') || pathname === '/(app)') {
    return ROUTE_TITLES['/']
  }
  if (/\/factures\/[^/]+/.test(pathname)) return 'Facture'
  if (/\/devis\/[^/]+/.test(pathname)) return 'Devis'
  for (const [segment, title] of Object.entries(ROUTE_TITLES)) {
    if (segment !== '/' && pathname.includes(segment)) return title
  }
  return APP_NAME
}
