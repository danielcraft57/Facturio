import { payablesService, parsePayablesDebtsListPage } from '../services/payables'
import type { PayableDebtRow } from '../services/payables'
import type { DocumentFolder } from '../types/documentFolders'
import { useFinanceDocumentFolderList } from './useFinanceDocumentFolderList'

export function usePayablesFolderList(activeFolder: DocumentFolder, debouncedSearch: string) {
  const result = useFinanceDocumentFolderList<PayableDebtRow>(
    activeFolder,
    debouncedSearch,
    async (opts) => {
      const response = await payablesService.listDebts({
        folder: opts.folder,
        search: opts.search,
        includeFolderCounts: opts.includeFolderCounts,
        page: opts.page,
        limit: opts.limit,
      })
      const parsed = parsePayablesDebtsListPage(response)
      return {
        items: parsed.debts,
        total: parsed.total,
        page: parsed.page,
        pageSize: parsed.pageSize,
        folderCounts: parsed.folderCounts,
      }
    },
    'Erreur lors du chargement des dettes',
  )

  return {
    debts: result.items,
    ...result,
  }
}
