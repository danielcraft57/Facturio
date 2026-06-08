import { apiClient } from '../services/api'
import { ApiClient } from '../services/apiClient'
import { catalogService } from '../services/catalogService'
import { productService } from '../services/productService'
import { quoteService } from '../services/quoteService'
import { FINANCE_DOCUMENT_PAGE_SIZE } from '../hooks/useFinanceDocumentFolderList'
import { CLIENTS_PAGE_SIZE } from '../hooks/useClientsFolderList'
import { prefetchFinanceRouteChunks } from './prefetchFinanceRoutes'
import type { DocumentFolder } from '../types/documentFolders'

const FOLDER_LIST_CACHE_TTL_MS = 2 * 60 * 1000
const quotesApiClient = ApiClient.getInstance()

const WARM_FOLDERS: DocumentFolder[] = ['inbox', 'nouveau', 'envoyes', 'brouillons']

function warmDevisListCaches(): Promise<unknown>[] {
  return WARM_FOLDERS.flatMap((folder) => {
    const url = quoteService.buildListUrl(
      { folder, includeFolderCounts: true },
      1,
      FINANCE_DOCUMENT_PAGE_SIZE,
    )
    return [
      apiClient.getCached(url, FOLDER_LIST_CACHE_TTL_MS),
      quotesApiClient.getCached(url, FOLDER_LIST_CACHE_TTL_MS),
    ]
  })
}

/**
 * Précharge chunks JS + listes après connexion (cache mémoire API + moins de Suspense).
 */
export async function warmAppDataAfterLogin(): Promise<void> {
  prefetchFinanceRouteChunks()

  const inboxListWarmers = [
    apiClient.getCached(
      `/factures?folder=inbox&page=1&limit=${FINANCE_DOCUMENT_PAGE_SIZE}&includeFolderCounts=1`,
      FOLDER_LIST_CACHE_TTL_MS,
    ),
    apiClient.getCached(
      `/clients?folder=inbox&page=1&limit=${CLIENTS_PAGE_SIZE}&includeFolderCounts=1`,
      FOLDER_LIST_CACHE_TTL_MS,
    ),
    apiClient.getCached(
      `/payables/debts?folder=inbox&page=1&limit=${FINANCE_DOCUMENT_PAGE_SIZE}&includeFolderCounts=1`,
      FOLDER_LIST_CACHE_TTL_MS,
    ),
    ...warmDevisListCaches(),
  ]

  const [{ useInvoicesStore }, { useQuotesStore }] = await Promise.all([
    import('../stores/invoicesStore'),
    import('../stores/quotesStore'),
  ])

  await Promise.allSettled([
    ...inboxListWarmers,
    catalogService.prefetchTechChoices(),
    productService.prefetchCatalog(100),
    useInvoicesStore.getState().fetchInvoices({
      folder: 'inbox',
      limit: 50,
      includeFolderCounts: true,
    }),
    useQuotesStore.getState().fetchQuotes({ folder: 'inbox' }, 1),
  ])
}
