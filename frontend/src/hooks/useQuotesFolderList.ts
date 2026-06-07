import { ApiClient } from '../services/apiClient'
import { parseQuotesListPage, quoteService } from '../services/quoteService'
import type { Quote } from '../types/quote'
import type { DocumentFolder } from '../types/documentFolders'
import {
  FINANCE_DOCUMENT_PAGE_SIZE,
  useFinanceDocumentFolderList,
  type FinanceFolderListPage,
} from './useFinanceDocumentFolderList'

const quotesApiClient = ApiClient.getInstance()

function readQuotesBootPage(
  folder: DocumentFolder,
  search: string,
): FinanceFolderListPage<Quote> | null {
  const trimmed = search.trim()
  const cached = quotesApiClient.peekCached(
    quoteService.buildListUrl(
      {
        folder,
        search: trimmed || undefined,
        includeFolderCounts: !trimmed,
      },
      1,
      FINANCE_DOCUMENT_PAGE_SIZE,
    ),
  )
  if (!cached) return null
  const parsed = parseQuotesListPage(cached)
  return {
    items: parsed.quotes,
    total: parsed.total,
    page: parsed.page,
    pageSize: parsed.pageSize,
    folderCounts: parsed.folderCounts,
  }
}

export function useQuotesFolderList(activeFolder: DocumentFolder, debouncedSearch: string) {
  const result = useFinanceDocumentFolderList<Quote>(
    activeFolder,
    debouncedSearch,
    async (opts) => {
      const response = await quoteService.getQuotes(
        {
          folder: opts.folder,
          search: opts.search,
          includeFolderCounts: opts.includeFolderCounts,
        },
        opts.page,
        opts.limit,
      )
      const parsed = parseQuotesListPage(response)
      return {
        items: parsed.quotes,
        total: parsed.total,
        page: parsed.page,
        pageSize: parsed.pageSize,
        folderCounts: parsed.folderCounts,
      }
    },
    'Erreur lors du chargement des devis',
    readQuotesBootPage,
    'devis',
  )

  return {
    quotes: result.items,
    ...result,
  }
}
