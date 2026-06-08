import { useCallback, useEffect, useRef, useState } from 'react'
import { productService } from '../services/productService'
import { unwrapApiPayload } from '../services/clients'
import type { Product, ProductFilters } from '../types/product'
import { normalizeProductFromApi } from '../modules/products/utils/productVisual'

const CATALOG_PAGE_SIZE = 100

function parseProductsPage(res: unknown): { items: Product[]; total: number; page: number } {
  const raw = unwrapApiPayload<Record<string, unknown>>(res)
  const list = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.data)
      ? raw.data
      : []
  const items = list.map((p) => normalizeProductFromApi(p as Record<string, unknown>))
  return {
    items,
    total: Number(raw?.total ?? items.length),
    page: Number(raw?.page ?? 1),
  }
}

/** Liste catalogue produits avec refresh (pattern factures / devis). */
export function useProductsCatalogList(debouncedSearch: string) {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [listEpoch, setListEpoch] = useState(0)
  const fetchGen = useRef(0)

  const refresh = useCallback(async () => {
    const gen = ++fetchGen.current
    setError(null)
    const filters: ProductFilters = debouncedSearch.trim()
      ? { search: debouncedSearch.trim() }
      : {}

    const cached = debouncedSearch.trim() ? null : productService.peekCatalogCache(undefined, 1, CATALOG_PAGE_SIZE)
    if (cached && gen === fetchGen.current) {
      const parsed = parseProductsPage(cached)
      if (parsed.items.length > 0) {
        setProducts(parsed.items)
        setTotal(parsed.total)
        setLoading(false)
      }
    } else {
      setLoading(true)
    }

    try {
      const res = await productService.getProducts(filters, 1, CATALOG_PAGE_SIZE)
      if (gen !== fetchGen.current) return
      const parsed = parseProductsPage(res)
      setProducts(parsed.items)
      setTotal(parsed.total)
      setListEpoch((e) => e + 1)
    } catch (err) {
      if (gen !== fetchGen.current) return
      const message = err instanceof Error ? err.message : 'Impossible de charger le catalogue'
      setError(message)
      console.error('Erreur chargement catalogue produits', err)
      throw err
    } finally {
      if (gen === fetchGen.current) setLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    fetchGen.current += 1
    void refresh().catch(() => {
      /* toast géré par la page */
    })
  }, [refresh])

  const prependProduct = useCallback((product: Product) => {
    setProducts((prev) => [product, ...prev.filter((p) => p.id !== product.id)])
    setTotal((t) => t + 1)
    setListEpoch((e) => e + 1)
  }, [])

  const patchProduct = useCallback((product: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)))
    setListEpoch((e) => e + 1)
  }, [])

  const removeProduct = useCallback((id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setTotal((t) => Math.max(0, t - 1))
    setListEpoch((e) => e + 1)
  }, [])

  return {
    products,
    setProducts,
    total,
    loading,
    error,
    initialLoading: loading && products.length === 0 && !error,
    refresh,
    listEpoch,
    prependProduct,
    patchProduct,
    removeProduct,
  }
}
