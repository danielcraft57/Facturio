import { useCallback, useEffect, useRef, useState } from 'react'
import type { DocumentFolder, DocumentFolderCounts } from '../types/documentFolders'

export const FINANCE_DOCUMENT_PAGE_SIZE = 30

const EMPTY_COUNTS: DocumentFolderCounts = {
  inbox: 0,
  nouveau: 0,
  suivi: 0,
  attente: 0,
  important: 0,
  envoyes: 0,
  brouillons: 0,
}

export type FinanceFolderListFetchOpts = {
  page: number
  limit: number
  folder: DocumentFolder
  search?: string
  includeFolderCounts?: boolean
}

export type FinanceFolderListPage<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  folderCounts?: DocumentFolderCounts
}

type FetchOpts = {
  page: number
  append: boolean
  withCounts?: boolean
  search?: string
}

export function useFinanceDocumentFolderList<T>(
  activeFolder: DocumentFolder,
  debouncedSearch: string,
  fetchListPage: (opts: FinanceFolderListFetchOpts) => Promise<FinanceFolderListPage<T>>,
  defaultError: string,
) {
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [folderCounts, setFolderCounts] = useState<DocumentFolderCounts>(EMPTY_COUNTS)
  const [countsReady, setCountsReady] = useState(false)
  const fetchGen = useRef(0)
  const currentPage = useRef(1)
  const fetchListPageRef = useRef(fetchListPage)
  fetchListPageRef.current = fetchListPage

  const hasMore = items.length < total

  const fetchPage = useCallback(
    async (opts: FetchOpts) => {
      const gen = ++fetchGen.current
      const isFirst = opts.page === 1 && !opts.append

      if (isFirst) setLoading(true)
      else setLoadingMore(true)

      try {
        if (isFirst) setError(null)

        const parsed = await fetchListPageRef.current({
          page: opts.page,
          limit: FINANCE_DOCUMENT_PAGE_SIZE,
          folder: activeFolder,
          search: opts.search?.trim() || undefined,
          includeFolderCounts: opts.withCounts,
        })

        if (gen !== fetchGen.current) return

        currentPage.current = parsed.page
        setTotal(parsed.total)
        setItems((prev) => (opts.append ? [...prev, ...parsed.items] : parsed.items))

        if (parsed.folderCounts) {
          setFolderCounts({ ...EMPTY_COUNTS, ...parsed.folderCounts })
          setCountsReady(true)
        } else if (opts.withCounts) {
          setCountsReady(true)
        }
      } catch (err) {
        if (gen !== fetchGen.current) return
        setError(err instanceof Error ? err.message : defaultError)
        console.error(defaultError, err)
      } finally {
        if (gen === fetchGen.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [activeFolder, defaultError],
  )

  const refresh = useCallback(async () => {
    await fetchPage({
      page: 1,
      append: false,
      withCounts: true,
      search: debouncedSearch,
    })
  }, [fetchPage, debouncedSearch])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return
    void fetchPage({
      page: currentPage.current + 1,
      append: true,
      search: debouncedSearch,
    })
  }, [loading, loadingMore, hasMore, fetchPage, debouncedSearch])

  // fetchListPage tenu en ref : évite boucle si le callback parent est recréé à chaque render
  useEffect(() => {
    fetchGen.current += 1
    setItems([])
    setTotal(0)
    const withCounts = !debouncedSearch.trim()
    if (withCounts) setCountsReady(false)
    void fetchPage({
      page: 1,
      append: false,
      withCounts,
      search: debouncedSearch,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPage stable via fetchListPageRef
  }, [activeFolder, debouncedSearch])

  return {
    items,
    total,
    loading,
    loadingMore,
    error,
    setError,
    folderCounts,
    countsReady,
    hasMore,
    loadMore,
    refresh,
    pageSize: FINANCE_DOCUMENT_PAGE_SIZE,
  }
}
