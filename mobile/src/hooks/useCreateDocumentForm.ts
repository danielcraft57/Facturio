import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DocumentDraftLine } from '../components/documents/DocumentLinesEditor'
import { clientsService } from '../services/clientsService'
import { productsService } from '../services/productsService'
import type { Client } from '../types/client'
import type { ProductSuggestion } from '../services/productsService'

export type CreateDocumentKind = 'quote' | 'invoice'

function defaultExpiryDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

function emptyLine(kind: CreateDocumentKind): DocumentDraftLine {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    description: '',
    quantity: '1',
    unitPrice: '0',
    taxRate: kind === 'invoice' ? '20' : '0.2',
  }
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function parseDecimal(value: string) {
  const n = Number(value.replace(',', '.').trim())
  return Number.isFinite(n) ? n : 0
}

export function useCreateDocumentForm(kind: CreateDocumentKind, visible: boolean) {
  const [clientQuery, setClientQuery] = useState('')
  const [clientSuggestions, setClientSuggestions] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [willCreateClient, setWillCreateClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [createClientError, setCreateClientError] = useState<string | null>(null)
  const [creatingClient, setCreatingClient] = useState(false)

  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate)
  const [dueDate, setDueDate] = useState(defaultExpiryDate)

  const [lines, setLines] = useState<DocumentDraftLine[]>([emptyLine(kind)])
  const [productSuggestionsByLine, setProductSuggestionsByLine] = useState<Record<string, ProductSuggestion[]>>({})
  const productCacheRef = useRef<Record<string, ProductSuggestion[]>>({})
  const productDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const reset = useCallback(() => {
    setClientQuery('')
    setClientSuggestions([])
    setSelectedClientId(null)
    setWillCreateClient(false)
    setNewClientName('')
    setNewClientEmail('')
    setCreateClientError(null)
    setExpiryDate(defaultExpiryDate())
    setDueDate(defaultExpiryDate())
    setLines([emptyLine(kind)])
    setProductSuggestionsByLine({})
  }, [kind])

  useEffect(() => {
    if (!visible) return
    reset()
  }, [visible, reset])

  useEffect(() => {
    const q = clientQuery.trim()
    if (q.length < 2) {
      setClientSuggestions([])
      return
    }
    setClientsLoading(true)
    clientsService
      .list({ page: 1, limit: 8, search: q })
      .then((res) => setClientSuggestions(res.items ?? res.clients ?? []))
      .catch(() => setClientSuggestions([]))
      .finally(() => setClientsLoading(false))
  }, [clientQuery])

  const onClientQueryChange = (value: string) => {
    setClientQuery(value)
    setCreateClientError(null)
    setSelectedClientId(null)
    const trimmed = value.trim()
    if (!trimmed) {
      setWillCreateClient(false)
      setNewClientName('')
      setNewClientEmail('')
    }
  }

  useEffect(() => {
    const trimmed = clientQuery.trim()
    if (!trimmed || selectedClientId) return
    const emailMatch = isEmail(trimmed)
    const exact = clientSuggestions.find(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() ||
        (c.email && c.email.toLowerCase() === trimmed.toLowerCase()) ||
        `${c.name} — ${c.email}`.toLowerCase() === trimmed.toLowerCase(),
    )
    if (exact) {
      setWillCreateClient(false)
      setSelectedClientId(exact.id)
      return
    }
    if (trimmed.length >= 2 && !clientsLoading) {
      setWillCreateClient(true)
      setNewClientName((prev) => prev || (emailMatch ? '' : trimmed))
      setNewClientEmail((prev) => prev || (emailMatch ? trimmed.toLowerCase() : ''))
    }
  }, [clientQuery, clientSuggestions, clientsLoading, selectedClientId])

  const selectClient = (client: Client) => {
    setSelectedClientId(client.id)
    setWillCreateClient(false)
    setCreateClientError(null)
    setClientQuery(client.email ? `${client.name} — ${client.email}` : client.name)
    setClientSuggestions([])
  }

  const confirmCreateClient = async (): Promise<string | null> => {
    const name = newClientName.trim()
    const email = newClientEmail.trim()
    if (!name) {
      setCreateClientError('Le nom du client est obligatoire.')
      return null
    }
    if (!isEmail(email)) {
      setCreateClientError('Email invalide.')
      return null
    }
    setCreatingClient(true)
    try {
      const created = await clientsService.create({ name, email })
      setSelectedClientId(created.id)
      setWillCreateClient(false)
      setClientQuery(created.email ? `${created.name} — ${created.email}` : created.name)
      setCreateClientError(null)
      return created.id
    } catch (e) {
      setCreateClientError(e instanceof Error ? e.message : 'Création client impossible.')
      return null
    } finally {
      setCreatingClient(false)
    }
  }

  const queryProducts = useCallback((lineId: string, rawQuery: string) => {
    const query = rawQuery.trim().toLowerCase()
    if (productDebounceRef.current[lineId]) clearTimeout(productDebounceRef.current[lineId])
    if (query.length < 2) {
      setProductSuggestionsByLine((prev) => ({ ...prev, [lineId]: [] }))
      return
    }
    if (productCacheRef.current[query]) {
      setProductSuggestionsByLine((prev) => ({ ...prev, [lineId]: productCacheRef.current[query] }))
      return
    }
    productDebounceRef.current[lineId] = setTimeout(() => {
      productsService
        .search(query, 6)
        .then((items) => {
          productCacheRef.current[query] = items
          setProductSuggestionsByLine((prev) => ({ ...prev, [lineId]: items }))
        })
        .catch(() => setProductSuggestionsByLine((prev) => ({ ...prev, [lineId]: [] })))
    }, 220)
  }, [])

  const updateLine = (lineId: string, patch: Partial<DocumentDraftLine>) => {
    setLines((prev) => prev.map((line) => (line.id === lineId ? { ...line, ...patch } : line)))
  }

  const onDescriptionChange = (lineId: string, value: string) => {
    updateLine(lineId, { description: value })
    queryProducts(lineId, value)
  }

  const onProductSelect = (lineId: string, product: ProductSuggestion) => {
    updateLine(lineId, {
      description: product.name,
      unitPrice: product.unitPrice != null ? String(Math.round(Number(product.unitPrice))) : '0',
    })
    setProductSuggestionsByLine((prev) => ({ ...prev, [lineId]: [] }))
  }

  const addLine = () => {
    const next = emptyLine(kind)
    setLines((prev) => [...prev, next])
  }

  const removeLine = (lineId: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== lineId)))
  }

  const duplicateLine = (lineId: string) => {
    const source = lines.find((l) => l.id === lineId)
    if (!source) return
    setLines((prev) => [...prev, { ...source, id: emptyLine(kind).id }])
  }

  const normalizedLines = useMemo(() => {
    return lines
      .map((line) => {
        const quantity = parseDecimal(line.quantity) || 1
        const unitPrice = parseDecimal(line.unitPrice)
        const taxRaw = parseDecimal(line.taxRate)
        const taxRate = kind === 'invoice' ? taxRaw / 100 : taxRaw
        return {
          description: line.description.trim(),
          quantity,
          unitPrice,
          taxRate,
        }
      })
      .filter((line) => line.description && line.unitPrice > 0)
  }, [lines, kind])

  const totals = useMemo(() => {
    const subtotal = normalizedLines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
    const tax = normalizedLines.reduce((sum, line) => sum + line.quantity * line.unitPrice * line.taxRate, 0)
    return { subtotal, tax, total: subtotal + tax }
  }, [normalizedLines])

  const resolveClientId = async (): Promise<string | null> => {
    if (selectedClientId) return selectedClientId
    if (willCreateClient) return confirmCreateClient()
    return null
  }

  const clientReady =
    Boolean(selectedClientId) ||
    (willCreateClient && Boolean(newClientName.trim()) && isEmail(newClientEmail))

  const canSubmit = clientReady && normalizedLines.length > 0

  return {
    kind,
    clientQuery,
    onClientQueryChange,
    clientSuggestions,
    clientsLoading,
    selectedClientId,
    willCreateClient,
    newClientName,
    newClientEmail,
    createClientError,
    creatingClient,
    selectClient,
    setNewClientName,
    setNewClientEmail,
    confirmCreateClient,
    setWillCreateClient: () => {
      setWillCreateClient(false)
      setCreateClientError(null)
    },
    expiryDate,
    setExpiryDate,
    dueDate,
    setDueDate,
    lines,
    productSuggestionsByLine,
    onDescriptionChange,
    updateLine,
    onProductSelect,
    addLine,
    removeLine,
    duplicateLine,
    normalizedLines,
    totals,
    resolveClientId,
    canSubmit,
    taxLabel: kind === 'invoice' ? 'TVA (%)' : 'TVA (0-1)',
  }
}
