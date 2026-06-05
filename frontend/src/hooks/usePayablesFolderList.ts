import { apiClient } from '../services/api'
import { payablesService, parsePayablesDebtsListPage } from '../services/payables'
import type { PayableDebtRow } from '../services/payables'
import type { DocumentFolder } from '../types/documentFolders'
import {
  FINANCE_DOCUMENT_PAGE_SIZE,
  useFinanceDocumentFolderList,
  type FinanceFolderListPage,
} from './useFinanceDocumentFolderList'

function readPayablesBootPage(
  folder: DocumentFolder,
  search: string,
): FinanceFolderListPage<PayableDebtRow> | null {
  const trimmed = search.trim()
  const cached = apiClient.peekCached(
    payablesService.buildDebtsListUrl({
      folder,
      page: 1,
      limit: FINANCE_DOCUMENT_PAGE_SIZE,
      search: trimmed || undefined,
      includeFolderCounts: !trimmed,
    }),
  )
  if (!cached) return null
  const parsed = parsePayablesDebtsListPage(cached)
  return {
    items: parsed.debts,
    total: parsed.total,
    page: parsed.page,
    pageSize: parsed.pageSize,
    folderCounts: parsed.folderCounts,
  }
}

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
    readPayablesBootPage,
    'dettes',
  )

  return {
    debts: result.items,
    ...result,
  }
}
