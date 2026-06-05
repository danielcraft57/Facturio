import { useCallback, useEffect, useRef, useState } from 'react'
import type { DocumentFolder, DocumentFolderCounts } from '../types/documentFolders'
import { normalizeDocumentFolderCounts } from '../types/documentFolders'

export const FINANCE_DOCUMENT_PAGE_SIZE = 30

const EMPTY_COUNTS: DocumentFolderCounts = normalizeDocumentFolderCounts()

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
  /** Rafraîchissement temps réel sans spinner (évite d’écraser le patch optimiste). */
  silent?: boolean
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

      if (!opts.silent) {
        if (isFirst) setLoading(true)
        else setLoadingMore(true)
      }

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
          setFolderCounts(normalizeDocumentFolderCounts(parsed.folderCounts))
          setCountsReady(true)
        } else if (opts.withCounts) {
          setCountsReady(true)
        }
      } catch (err) {
        if (gen !== fetchGen.current) return
        setError(err instanceof Error ? err.message : defaultError)
        console.error(defaultError, err)
      } finally {
        if (!opts.silent && gen === fetchGen.current) {
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

  const refreshSilent = useCallback(async () => {
    await fetchPage({
      page: 1,
      append: false,
      withCounts: true,
      search: debouncedSearch,
      silent: true,
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

  const removeItemsById = useCallback((ids: Iterable<string | number>) => {
    const idSet = new Set([...ids].map(String))
    if (!idSet.size) return
    setItems((prev) =>
      prev.filter((item) => !idSet.has(String((item as { id: string | number }).id))),
    )
    setTotal((prev) => Math.max(0, prev - idSet.size))
  }, [])

  const prependItems = useCallback((newItems: T[]) => {
    if (!newItems.length) return
    setItems((prev) => {
      const existing = new Set(prev.map((item) => String((item as { id: string | number }).id)))
      const toAdd = newItems.filter(
        (item) => !existing.has(String((item as { id: string | number }).id)),
      )
      if (!toAdd.length) return prev
      return [...toAdd, ...prev]
    })
    setTotal((prev) => prev + newItems.length)
  }, [])

  const patchItemById = useCallback(
    (id: string | number, patch: Partial<T> | ((item: T) => T)) => {
      const key = String(id)
      setItems((prev) =>
        prev.map((item) => {
          if (String((item as { id: string | number }).id) !== key) return item
          return typeof patch === 'function' ? patch(item) : { ...item, ...patch }
        }),
      )
    },
    [],
  )

  const bumpFolderCounts = useCallback((delta: Partial<DocumentFolderCounts>) => {
    setFolderCounts((prev) => {
      const next = { ...prev }
      for (const [key, value] of Object.entries(delta) as [keyof DocumentFolderCounts, number][]) {
        if (typeof value === 'number') {
          next[key] = Math.max(0, (next[key] ?? 0) + value)
        }
      }
      return normalizeDocumentFolderCounts(next)
    })
  }, [])

  // fetchListPage tenu en ref : évite boucle si le callback parent est recréé à chaque render
  useEffect(() => {
    fetchGen.current += 1
    setItems([])
    setTotal(0)
    const withCounts = !debouncedSearch.trim()
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
    setItems,
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
    refreshSilent,
    removeItemsById,
    prependItems,
    patchItemById,
    bumpFolderCounts,
    pageSize: FINANCE_DOCUMENT_PAGE_SIZE,
  }
}
