import { useCallback, useEffect, useRef, useState } from 'react'
import {
  clientService,
  parseClientsListPage,
  type Client,
  type ClientFolder,
  type ClientFolderCounts,
} from '../services/clients'

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
}

export function useClientsFolderList(activeFolder: ClientFolder, debouncedSearch: string) {
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [folderCounts, setFolderCounts] = useState<ClientFolderCounts>(EMPTY_COUNTS)
  const [countsReady, setCountsReady] = useState(false)
  const fetchGen = useRef(0)
  const currentPage = useRef(1)

  const hasMore = clients.length < total

  const fetchPage = useCallback(
    async (opts: FetchOpts) => {
      const gen = ++fetchGen.current
      const isFirst = opts.page === 1 && !opts.append

      if (isFirst) setLoading(true)
      else setLoadingMore(true)

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
      } catch (err) {
        if (gen !== fetchGen.current) return
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des clients')
        console.error('Clients error:', err)
      } finally {
        if (gen === fetchGen.current) {
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
    setClients([])
    setTotal(0)
    const withCounts = !debouncedSearch.trim()
    if (withCounts) setCountsReady(false)
    void fetchPage({
      page: 1,
      append: false,
      withCounts,
      search: debouncedSearch,
    })
  }, [activeFolder, debouncedSearch, fetchPage])

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

  return {
    clients,
    setClients,
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
    patchClientById,
    prependClients,
    removeClientById,
    pageSize: CLIENTS_PAGE_SIZE,
  }
}
