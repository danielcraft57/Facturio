import { apiClient } from '../services/api'
import { invoiceService, parseInvoicesListPage } from '../services/invoices'
import type { Invoice } from '../services/invoices'
import type { DocumentFolder } from '../types/documentFolders'
import {
  FINANCE_DOCUMENT_PAGE_SIZE,
  useFinanceDocumentFolderList,
  type FinanceFolderListPage,
} from './useFinanceDocumentFolderList'

function readInvoicesBootPage(
  folder: DocumentFolder,
  search: string,
): FinanceFolderListPage<Invoice> | null {
  const trimmed = search.trim()
  const cached = apiClient.peekCached(
    invoiceService.buildListUrl({
      folder,
      page: 1,
      limit: FINANCE_DOCUMENT_PAGE_SIZE,
      search: trimmed || undefined,
      includeFolderCounts: !trimmed,
    }),
  )
  if (!cached) return null
  const parsed = parseInvoicesListPage(cached)
  return {
    items: parsed.invoices,
    total: parsed.total,
    page: parsed.page,
    pageSize: parsed.pageSize,
    folderCounts: parsed.folderCounts,
  }
}

export function useInvoicesFolderList(activeFolder: DocumentFolder, debouncedSearch: string) {
  const result = useFinanceDocumentFolderList<Invoice>(
    activeFolder,
    debouncedSearch,
    async (opts) => {
      const response = await invoiceService.getInvoices({
        page: opts.page,
        limit: opts.limit,
        folder: opts.folder,
        search: opts.search,
        includeFolderCounts: opts.includeFolderCounts,
      })
      const parsed = parseInvoicesListPage(response)
      return {
        items: parsed.invoices,
        total: parsed.total,
        page: parsed.page,
        pageSize: parsed.pageSize,
        folderCounts: parsed.folderCounts,
      }
    },
    'Erreur lors du chargement des factures',
    readInvoicesBootPage,
    'factures',
  )

  return {
    invoices: result.items,
    ...result,
  }
}
