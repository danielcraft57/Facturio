import { isClientFolder } from '../types/clientFolders'
import { isDocumentFolder } from '../types/documentFolders'

export type RouteTransitionKind = 'none' | 'soft' | 'full'

type ParsedRoute = {
  root: string
  second?: string
}

function parseRoute(pathname: string): ParsedRoute {
  const segments = pathname.split('/').filter(Boolean)
  return { root: segments[0] ?? '', second: segments[1] }
}

function isFolderSidebarRoute(root: string, second?: string): boolean {
  if (!second) return false
  if (root === 'clients') return isClientFolder(second)
  if (root === 'factures' || root === 'devis' || root === 'dettes') {
    return isDocumentFolder(second)
  }
  return false
}

/**
 * Profil de transition entre routes :
 * - none : changement de dossier sidebar (même page, animation gérée par le shell)
 * - soft : même section applicative (ex. liste → détail facture)
 * - full : changement de module (ex. factures → devis)
 */
export function resolveRouteTransition(
  previousPathname: string | null,
  nextPathname: string,
): RouteTransitionKind {
  if (!previousPathname || previousPathname === nextPathname) return 'full'

  const prev = parseRoute(previousPathname)
  const next = parseRoute(nextPathname)

  if (
    prev.root === next.root &&
    isFolderSidebarRoute(prev.root, prev.second) &&
    isFolderSidebarRoute(next.root, next.second)
  ) {
    return 'none'
  }

  if (prev.root === next.root) return 'soft'
  return 'full'
}

export function routeTransitionDurationMs(kind: RouteTransitionKind): number {
  if (kind === 'none') return 0
  if (kind === 'soft') return 180
  return 300
}
