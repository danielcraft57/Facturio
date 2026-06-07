import { useCallback, useEffect, useRef, useState } from 'react'
import type { DocumentFolder, DocumentFolderCounts } from '../types/documentFolders'
import { normalizeDocumentFolderCounts } from '../types/documentFolders'
import {
  isFolderListSessionWarmed,
  markFolderListSessionWarmed,
} from '../utils/folderListSession'

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
  /** Rafraîchissement temps réel / cache sans spinner. */
  silent?: boolean
}

type BootPageReader<T> = (
  folder: DocumentFolder,
  search: string,
) => FinanceFolderListPage<T> | null

function applyBootPage<T>(
  boot: FinanceFolderListPage<T>,
  setters: {
    setItems: (items: T[]) => void
    setTotal: (total: number) => void
    setFolderCounts: (counts: DocumentFolderCounts) => void
    setCountsReady: (ready: boolean) => void
  },
) {
  setters.setItems(boot.items)
  setters.setTotal(boot.total)
  if (boot.folderCounts) {
    setters.setFolderCounts(normalizeDocumentFolderCounts(boot.folderCounts))
    setters.setCountsReady(true)
  }
}

export function useFinanceDocumentFolderList<T>(
  activeFolder: DocumentFolder,
  debouncedSearch: string,
  fetchListPage: (opts: FinanceFolderListFetchOpts) => Promise<FinanceFolderListPage<T>>,
  defaultError: string,
  readBootPage?: BootPageReader<T>,
  moduleKey?: string,
) {
  const initialBoot = readBootPage?.(activeFolder, debouncedSearch) ?? null

  const [items, setItems] = useState<T[]>(() => {
    if (initialBoot && moduleKey) markFolderListSessionWarmed(moduleKey)
    return initialBoot?.items ?? []
  })
  const [total, setTotal] = useState(() => initialBoot?.total ?? 0)
  const [loading, setLoading] = useState(() => !initialBoot)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [folderCounts, setFolderCounts] = useState<DocumentFolderCounts>(() =>
    initialBoot?.folderCounts
      ? normalizeDocumentFolderCounts(initialBoot.folderCounts)
      : EMPTY_COUNTS,
  )
  const [countsReady, setCountsReady] = useState(() => !!initialBoot?.folderCounts)
  const fetchGen = useRef(0)
  const currentPage = useRef(1)
  const fetchListPageRef = useRef(fetchListPage)
  const readBootPageRef = useRef(readBootPage)
  fetchListPageRef.current = fetchListPage
  readBootPageRef.current = readBootPage

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

        if (isFirst && moduleKey) markFolderListSessionWarmed(moduleKey)
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
    [activeFolder, defaultError, moduleKey],
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

  useEffect(() => {
    fetchGen.current += 1
    const withCounts = !debouncedSearch.trim()
    const cached = readBootPageRef.current?.(activeFolder, debouncedSearch) ?? null

    if (cached) {
      applyBootPage(cached, { setItems, setTotal, setFolderCounts, setCountsReady })
      if (moduleKey) markFolderListSessionWarmed(moduleKey)
      setLoading(false)
      void fetchPage({
        page: 1,
        append: false,
        withCounts,
        search: debouncedSearch,
        silent: true,
      })
      return
    }

    setItems([])
    setTotal(0)
    if (withCounts) setCountsReady(false)
    void fetchPage({
      page: 1,
      append: false,
      withCounts,
      search: debouncedSearch,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPage stable via fetchListPageRef
  }, [activeFolder, debouncedSearch])

  const moduleReady = moduleKey ? isFolderListSessionWarmed(moduleKey) : false
  const coldLoading = loading && items.length === 0 && !moduleReady
  const folderLoading = loading && items.length === 0 && moduleReady

  return {
    items,
    setItems,
    total,
    loading,
    loadingMore,
    coldLoading,
    folderLoading,
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
