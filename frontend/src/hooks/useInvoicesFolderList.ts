import { invoiceService, parseInvoicesListPage } from '../services/invoices'
import type { Invoice } from '../services/invoices'
import type { DocumentFolder } from '../types/documentFolders'
import { useFinanceDocumentFolderList } from './useFinanceDocumentFolderList'

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
  )

  return {
    invoices: result.items,
    ...result,
  }
}
