import { useState, useEffect, useRef } from 'react'
import {
  Button,
  TextField,
  Box,
  Stack,
  CircularProgress,
} from '@mui/material'
import { Description } from '@mui/icons-material'
import { apiClient } from '../../../services/api'
import { clientService, mapApiClientToClient, parseClientsListResponse, toCreateClientPayload } from '../../../services/clients'
import type { Client } from '../../../services/clients'
import { useProductsStore } from '../../../stores/productsStore'
import { productService } from '../../../services/productService'
import { suggestProductSkuFromName } from '../../products/utils/productSku'
import type { CreateQuoteLineData } from '../../../types/quote'
import { financePrimaryButtonSx, financeOutlinedButtonSx } from '../../../components/finance/financeStyles'
import {
  FinanceFormDialogShell,
  FinanceFormSectionTitle,
  FinanceFormTotalsBox,
  financeFieldSx,
} from '../../../components/finance/FinanceFormDialog'
import { EditableProductLinesTable } from '../../../components/finance/EditableProductLinesTable'
import {
  applyProductLineFieldChange,
  ensureTrailingEmptyLine,
  filterProductLinesForSubmit,
  removeProductLine,
} from '../../../components/finance/editableProductLinesUtils'
import { FinanceClientAutocomplete, type FinanceClientOption } from '../../../components/finance/FinanceClientAutocomplete'
import { useToast } from '../../../components/useToast'
import {
  clientQueryDraft,
  guessClientNameFromQuery,
  isClientEmail,
} from '../../../components/finance/financeClientQuery'

interface CreateQuoteFormData {
  clientId: string
  expiryDate: string
  newClientName?: string
  newClientEmail?: string
  lines: (CreateQuoteLineData & { taxRate: number })[]
}

interface CreateQuoteDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: { clientId: string; expiryDate?: string; lines: CreateQuoteLineData[] }) => void
  defaultClientId?: string
  submitting?: boolean
}

interface ClientOption {
  id: string
  name: string
  email?: string
}

export function CreateQuoteDialog({
  open,
  onClose,
  onSubmit,
  defaultClientId,
  submitting = false,
}: CreateQuoteDialogProps) {
  const productsStore = useProductsStore()
  const toast = useToast()
  const submitInFlightRef = useRef(false)
  const [submitInFlight, setSubmitInFlight] = useState(false)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [loading, setLoading] = useState(false)
  const [clientQuery, setClientQuery] = useState('')
  const [willCreateClient, setWillCreateClient] = useState(false)
  const [createClientError, setCreateClientError] = useState<string | null>(null)
  const [clientFormSaving, setClientFormSaving] = useState(false)
  const [formData, setFormData] = useState<CreateQuoteFormData>({
    clientId: '',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    newClientName: '',
    newClientEmail: '',
    lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0.2 }],
  })

  useEffect(() => {
    if (!open) return
    submitInFlightRef.current = false
    setSubmitInFlight(false)
  }, [open])

  useEffect(() => {
    if (open) {
      setFormData({
        clientId: defaultClientId ?? '',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        newClientName: '',
        newClientEmail: '',
        lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0.2 }],
      })
      setClientQuery('')
      setWillCreateClient(false)
      setCreateClientError(null)
      loadClients()
      productsStore.fetchProducts()
    }
  }, [open, defaultClientId])

  const loadClients = async () => {
    try {
      setLoading(true)
      apiClient.invalidateCache('/clients')
      const res = await clientService.getClients({ page: 1, limit: 100 })
      const list = parseClientsListResponse(res)
      if (defaultClientId && !list.some((c) => c.id === defaultClientId)) {
        try {
          const one = await clientService.getClient(defaultClientId)
          if (one.data) list.push(one.data)
        } catch {
          // client hors première page
        }
      }
      setClients(
        list.map((c) => ({
          id: String(c.id),
          name: c.name,
          email: (c as Client).email,
        })),
      )
    } catch (error) {
      console.error('Erreur chargement clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  const createEmptyQuoteLine = (): CreateQuoteFormData['lines'][number] => ({
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 0.2,
  })

  const handleRemoveLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lines: removeProductLine(prev.lines, index, createEmptyQuoteLine),
    }))
  }

  const handleLineChange = (
    index: number,
    field: keyof CreateQuoteLineData | 'taxRate',
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      lines: applyProductLineFieldChange(
        prev.lines,
        index,
        (line) => {
          if (field === 'quantity') {
            line.quantity = 1
          } else if (field === 'unitPrice') {
            line.unitPrice = Math.round(Number(value) || 0)
          } else if (field === 'taxRate') {
            line.taxRate = Number(value)
          } else if (field === 'description') {
            line.description = String(value)
            line.productId = undefined
          } else if (field === 'productId') {
            line.productId = Number(value)
          }
          return line
        },
        createEmptyQuoteLine,
      ),
    }))
  }

  const ensureProductsLinked = async (linesToLink: typeof formData.lines) => {
    const existingByName = new Map(
      productsStore.products.map((p) => [((p.description ?? p.name ?? '').trim().toLowerCase()), p]),
    )
    const nextLines = [...linesToLink]
    for (let i = 0; i < nextLines.length; i += 1) {
      const line = nextLines[i]
      const key = line.description.trim().toLowerCase()
      if (!key) continue
      const known = existingByName.get(key)
      if (known) {
        nextLines[i] = {
          ...line,
          productId: Number(known.id),
          unitPrice: Math.round(Number(known.unitPrice ?? line.unitPrice ?? 0)),
        }
        continue
      }
      try {
        const lineName = line.description.trim()
        const created = await productService.createProduct({
          name: lineName,
          sku: suggestProductSkuFromName(lineName),
          description: lineName,
          unitPrice: Number(line.unitPrice) > 0 ? Number(line.unitPrice) : undefined,
        })
        const createdProduct = created.data
        if (createdProduct) {
          existingByName.set(key, createdProduct)
          nextLines[i] = {
            ...line,
            productId: Number(createdProduct.id),
            unitPrice: Math.round(Number(createdProduct.unitPrice ?? line.unitPrice ?? 0)),
          }
        }
      } catch (err) {
        console.error('Création automatique du produit catalogue', err)
        toast.warning(
          `Impossible d'enregistrer « ${line.description.trim()} » dans le catalogue — le devis sera créé sans lien produit.`,
        )
      }
    }
    await productsStore.fetchProducts()
    return nextLines
  }

  const resolveClientId = async (): Promise<string | null> => {
    if (formData.clientId) return formData.clientId
    if (!willCreateClient) return null
    const name = formData.newClientName?.trim() ?? ''
    const email = formData.newClientEmail?.trim() ?? ''
    if (!name) {
      setCreateClientError('Le nom du client est obligatoire.')
      return null
    }
    if (!email || !isClientEmail(email)) {
      setCreateClientError('Email invalide.')
      return null
    }
    try {
      setClientFormSaving(true)
      setCreateClientError(null)
      const payload = toCreateClientPayload({ name, email, status: 'prospect' })
      const res = await apiClient.post('/clients', payload)
      const raw = ((res as { data?: { data?: Record<string, unknown> } })?.data?.data ??
        (res as { data?: Record<string, unknown> })?.data ??
        {}) as Record<string, unknown>
      const created = mapApiClientToClient(raw)
      if (!created?.id) return null
      const id = String(created.id)
      setClients((prev) => [{ id, name: created.name, email: created.email }, ...prev])
      setFormData((prev) => ({ ...prev, clientId: id, newClientName: '', newClientEmail: '' }))
      setClientQuery(created.email ? `${created.name} — ${created.email}` : created.name)
      setWillCreateClient(false)
      return id
    } catch (e: unknown) {
      setCreateClientError(e instanceof Error ? e.message : 'Création impossible')
      return null
    } finally {
      setClientFormSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (submitInFlightRef.current || submitting) return
    submitInFlightRef.current = true
    setSubmitInFlight(true)
    try {
      const clientId = (await resolveClientId()) ?? formData.clientId
      const filledLines = filterProductLinesForSubmit(formData.lines)
      if (!clientId || filledLines.length === 0 || filledLines.some((l) => Number(l.unitPrice) < 0)) {
        return
      }

      const lines = await ensureProductsLinked(filledLines)
      await onSubmit({
        clientId,
        expiryDate: formData.expiryDate || undefined,
        lines: lines.map(({ productId, description, quantity, unitPrice, taxRate }) => ({
          productId: productId ?? undefined,
          description: description.trim(),
          quantity: 1,
          unitPrice: Math.round(Number(unitPrice)),
          taxRate: Number(taxRate),
        })),
      })
    } finally {
      submitInFlightRef.current = false
      setSubmitInFlight(false)
    }
  }

  const clientOptions: FinanceClientOption[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
  }))

  const openCreateClient = () => {
    const q = clientQuery.trim()
    setWillCreateClient(true)
    setCreateClientError(null)
    setFormData((prev) => ({
      ...prev,
      clientId: '',
      newClientName: prev.newClientName?.trim() ? prev.newClientName : guessClientNameFromQuery(q),
      newClientEmail: isClientEmail(q) ? q.toLowerCase() : prev.newClientEmail ?? '',
    }))
  }

  const submitCreateClient = async () => {
    const name = formData.newClientName?.trim() ?? ''
    const email = formData.newClientEmail?.trim() ?? ''
    if (!name) {
      setCreateClientError('Le nom du client est obligatoire.')
      return
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setCreateClientError('Email invalide.')
      return
    }
    try {
      setClientFormSaving(true)
      setCreateClientError(null)
      const payload = toCreateClientPayload({
        name,
        email,
        status: 'prospect',
      })
      const res = await apiClient.post('/clients', payload)
      const raw = ((res as any)?.data?.data ?? (res as any)?.data ?? {}) as Record<string, unknown>
      const created = mapApiClientToClient(raw)
      if (created?.id) {
        setClients((prev) => [
          { id: String(created.id), name: created.name, email: created.email },
          ...prev,
        ])
        setFormData((prev) => ({
          ...prev,
          clientId: String(created.id),
          newClientName: '',
          newClientEmail: '',
        }))
        setClientQuery(created.email ? `${created.name} — ${created.email}` : created.name)
        setWillCreateClient(false)
      }
    } catch (e: unknown) {
      setCreateClientError(e instanceof Error ? e.message : 'Création impossible')
    } finally {
      setClientFormSaving(false)
    }
  }

  const linesForTotals = filterProductLinesForSubmit(formData.lines)
  const subtotal = linesForTotals.reduce((s, l) => s + 1 * Number(l.unitPrice), 0)
  const tax = linesForTotals.reduce((s, l) => s + 1 * Number(l.unitPrice) * Number(l.taxRate ?? 0), 0)
  const total = subtotal + tax

  const clientReady =
    formData.clientId !== '' ||
    (willCreateClient &&
      Boolean(formData.newClientName?.trim()) &&
      isClientEmail(formData.newClientEmail ?? ''))

  const submitBusy = submitting || submitInFlight

  const submitDisabled =
    submitBusy ||
    clientFormSaving ||
    !clientReady ||
    filterProductLinesForSubmit(formData.lines).length === 0

  return (
    <>
    <FinanceFormDialogShell
      open={open}
      onClose={onClose}
      closeDisabled={submitBusy}
      title="Nouveau devis"
      subtitle="Client, validité, lignes HT et taux de TVA (décimal, ex. 0,2 = 20 %)."
      icon={<Description />}
      actions={
        <>
          <Button onClick={onClose} disabled={submitBusy} sx={financeOutlinedButtonSx}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={submitDisabled}
            sx={financePrimaryButtonSx}
            startIcon={
              submitBusy ? <CircularProgress size={18} color="inherit" /> : undefined
            }
          >
            {submitBusy ? 'Création…' : 'Créer le devis'}
          </Button>
        </>
      }
    >
      <Stack spacing={2.5}>
        <Box>
          <FinanceFormSectionTitle>Client</FinanceFormSectionTitle>
          <Box sx={{ ...financeFieldSx }}>
            <FinanceClientAutocomplete
              label="Client"
              placeholder="Nom ou email…"
              options={clientOptions}
              loading={loading}
              valueId={formData.clientId}
              query={clientQuery}
              onQueryChange={(v) => {
                setClientQuery(v)
                setCreateClientError(null)
                const draft = clientQueryDraft(v, clientOptions)
                if (!v.trim()) {
                  setWillCreateClient(false)
                  setFormData((p) => ({ ...p, clientId: '', newClientName: '', newClientEmail: '' }))
                  return
                }
                if (draft.matched) {
                  setWillCreateClient(false)
                  setFormData((p) => ({
                    ...p,
                    clientId: draft.matched!.id,
                    newClientName: '',
                    newClientEmail: draft.matched!.email?.trim() ?? '',
                  }))
                  return
                }
                setWillCreateClient(true)
                setFormData((p) => ({
                  ...p,
                  clientId: '',
                  newClientName: draft.suggestedName,
                  newClientEmail: draft.suggestedEmail || p.newClientEmail,
                }))
              }}
              onSelectClientId={(id) => {
                const picked = clientOptions.find((c) => c.id === id)
                setWillCreateClient(false)
                setFormData((p) => ({ ...p, clientId: id, newClientName: '', newClientEmail: '' }))
                if (picked) setClientQuery(picked.email ? `${picked.name} — ${picked.email}` : picked.name)
              }}
              onCreateRequested={openCreateClient}
              helperText="Tapez pour rechercher. Si le client n’existe pas, créez-le directement ici."
              creatingInline={willCreateClient}
              createName={formData.newClientName ?? ''}
              createEmail={formData.newClientEmail ?? ''}
              createError={createClientError}
              createBusy={clientFormSaving}
              onCreateNameChange={(v) => setFormData((p) => ({ ...p, newClientName: v }))}
              onCreateEmailChange={(v) => setFormData((p) => ({ ...p, newClientEmail: v }))}
              onCreateConfirm={() => void submitCreateClient()}
              onCreateCancel={() => {
                setWillCreateClient(false)
                setCreateClientError(null)
              }}
            />
          </Box>
        </Box>

        <Box>
          <FinanceFormSectionTitle>Validité</FinanceFormSectionTitle>
          <TextField
            label="Date limite de validité"
            type="date"
            value={formData.expiryDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
            sx={financeFieldSx}
          />
        </Box>

        <EditableProductLinesTable
          title="Lignes du devis"
          lines={formData.lines.map((line) => ({
            description: line.description,
            quantity: 1,
            unitPrice: Math.round(Number(line.unitPrice ?? 0)),
            taxRate: Number(line.taxRate ?? 0.2),
          }))}
          products={productsStore.products}
          taxHeader="TVA (0-1)"
          taxInputProps={{ min: 0, max: 1, step: 0.01 }}
          unitPriceWidth={96}
          taxWidth={80}
          descriptionWidth="64%"
          onRemoveLine={handleRemoveLine}
          onLineChange={(index, field, value) => handleLineChange(index, field, value)}
          onProductPicked={(index, product) => {
            const label = (product.name ?? '').trim()
            setFormData((prev) => {
              const next = [...prev.lines]
              next[index] = {
                ...next[index],
                description: label,
                productId: Number(product.id),
                unitPrice: Math.round(Number(product.unitPrice ?? next[index].unitPrice ?? 0)),
              }
              return {
                ...prev,
                lines: ensureTrailingEmptyLine(next, createEmptyQuoteLine),
              }
            })
          }}
        />

        <FinanceFormTotalsBox
          rows={[
            { label: 'Total HT', value: `${Math.round(subtotal).toFixed(0)} €` },
            { label: 'TVA', value: `${Math.round(tax).toFixed(0)} €` },
          ]}
          totalLabel="Total TTC"
          totalValue={`${Math.round(total).toFixed(0)} €`}
        />
      </Stack>
    </FinanceFormDialogShell>
    </>
  )
}
