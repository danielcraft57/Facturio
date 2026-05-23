import { parseQuotesListPage, quoteService } from '../services/quoteService'
import type { Quote } from '../types/quote'
import type { DocumentFolder } from '../types/documentFolders'
import { useFinanceDocumentFolderList } from './useFinanceDocumentFolderList'

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
  )

  return {
    quotes: result.items,
    ...result,
  }
}
