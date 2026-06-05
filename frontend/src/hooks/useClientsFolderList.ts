import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '../services/api'
import {
  clientService,
  parseClientsListPage,
  type Client,
  type ClientFolder,
  type ClientFolderCounts,
} from '../services/clients'
import {
  isFolderListSessionWarmed,
  markFolderListSessionWarmed,
} from '../utils/folderListSession'

export const CLIENTS_PAGE_SIZE = 30

const EMPTY_COUNTS: ClientFolderCounts = {
  inbox: 0,
  actifs: 0,
  inactifs: 0,
  prospects: 0,
  entreprises: 0,
  particuliers: 0,
}

type FetchOpts = {
  page: number
  append: boolean
  withCounts?: boolean
  search?: string
  silent?: boolean
}

function readClientsBootPage(folder: ClientFolder, search: string) {
  const trimmed = search.trim()
  const cached = apiClient.peekCached(
    clientService.buildListUrl({
      folder,
      page: 1,
      limit: CLIENTS_PAGE_SIZE,
      search: trimmed || undefined,
      includeFolderCounts: !trimmed,
    }),
  )
  if (!cached) return null
  return parseClientsListPage(cached)
}

export function useClientsFolderList(activeFolder: ClientFolder, debouncedSearch: string) {
  const initialBoot = readClientsBootPage(activeFolder, debouncedSearch)

  const [clients, setClients] = useState<Client[]>(() => {
    if (initialBoot) markFolderListSessionWarmed('clients')
    return initialBoot?.clients ?? []
  })
  const [total, setTotal] = useState(() => initialBoot?.total ?? 0)
  const [loading, setLoading] = useState(() => !initialBoot)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [folderCounts, setFolderCounts] = useState<ClientFolderCounts>(() =>
    initialBoot?.folderCounts ? { ...EMPTY_COUNTS, ...initialBoot.folderCounts } : EMPTY_COUNTS,
  )
  const [countsReady, setCountsReady] = useState(() => !!initialBoot?.folderCounts)
  const fetchGen = useRef(0)
  const currentPage = useRef(1)

  const hasMore = clients.length < total

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

        const response = await clientService.getClients({
          page: opts.page,
          limit: CLIENTS_PAGE_SIZE,
          folder: activeFolder,
          search: opts.search?.trim() || undefined,
          includeFolderCounts: opts.withCounts,
        })

        if (gen !== fetchGen.current) return

        const parsed = parseClientsListPage(response)
        currentPage.current = parsed.page
        setTotal(parsed.total)
        setClients((prev) =>
          opts.append ? [...prev, ...parsed.clients] : parsed.clients,
        )

        if (parsed.folderCounts) {
          setFolderCounts({ ...EMPTY_COUNTS, ...parsed.folderCounts })
          setCountsReady(true)
        } else if (opts.withCounts) {
          setCountsReady(true)
        }

        if (isFirst) markFolderListSessionWarmed('clients')
      } catch (err) {
        if (gen !== fetchGen.current) return
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des clients')
        console.error('Clients error:', err)
      } finally {
        if (!opts.silent && gen === fetchGen.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [activeFolder],
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

  useEffect(() => {
    fetchGen.current += 1
    const withCounts = !debouncedSearch.trim()
    const cached = readClientsBootPage(activeFolder, debouncedSearch)

    if (cached) {
      setClients(cached.clients)
      setTotal(cached.total)
      if (cached.folderCounts) {
        setFolderCounts({ ...EMPTY_COUNTS, ...cached.folderCounts })
        setCountsReady(true)
      } else if (withCounts) {
        setCountsReady(false)
      }
      markFolderListSessionWarmed('clients')
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

    setClients([])
    setTotal(0)
    if (withCounts) setCountsReady(false)
    void fetchPage({
      page: 1,
      append: false,
      withCounts,
      search: debouncedSearch,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchPage stable pour activeFolder
  }, [activeFolder, debouncedSearch])

  const patchClientById = useCallback(
    (id: string, patch: Partial<Client> | ((client: Client) => Client)) => {
      setClients((prev) =>
        prev.map((client) => {
          if (client.id !== id) return client
          return typeof patch === 'function' ? patch(client) : { ...client, ...patch }
        }),
      )
    },
    [],
  )

  const prependClients = useCallback((newClients: Client[]) => {
    if (!newClients.length) return
    setClients((prev) => {
      const existing = new Set(prev.map((c) => c.id))
      const toAdd = newClients.filter((c) => !existing.has(c.id))
      if (!toAdd.length) return prev
      return [...toAdd, ...prev]
    })
    setTotal((prev) => prev + newClients.length)
  }, [])

  const removeClientById = useCallback((id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
    setTotal((prev) => Math.max(0, prev - 1))
  }, [])

  const moduleReady = isFolderListSessionWarmed('clients')
  const coldLoading = loading && clients.length === 0 && !moduleReady
  const folderLoading = loading && clients.length === 0 && moduleReady

  return {
    clients,
    setClients,
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
    patchClientById,
    prependClients,
    removeClientById,
    pageSize: CLIENTS_PAGE_SIZE,
  }
}
