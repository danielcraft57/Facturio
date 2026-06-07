/** Précharge les chunks JS des pages dossiers (factures, devis, clients, dettes). */
export function prefetchFinanceRouteChunks(): void {
  const run = () => {
    void import('../modules/app/routes/clientFolderRoutes')
    void import('../modules/app/routes/documentFolderRoutes')
    void import('../modules/finance/ReceivablesPage')
    void import('../modules/products/ProductsPage')
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 2500 })
  } else {
    window.setTimeout(run, 400)
  }
}

const prefetched = new Set<string>()

/** Précharge un chunk au survol d’un lien menu. */
export function prefetchFinanceRouteFromPath(path: string): void {
  const key = path.split('?')[0]?.split('#')[0] ?? path
  if (prefetched.has(key)) return
  prefetched.add(key)

  if (key.startsWith('/clients')) {
    void import('../modules/app/routes/clientFolderRoutes')
    return
  }
  if (
    key.startsWith('/factures') ||
    key.startsWith('/devis') ||
    key.startsWith('/dettes')
  ) {
    void import('../modules/app/routes/documentFolderRoutes')
    return
  }
  if (key.startsWith('/encours/creances')) {
    void import('../modules/finance/ReceivablesPage')
    return
  }
  if (key.startsWith('/prestations')) {
    void import('../modules/products/ProductsPage')
  }
}
