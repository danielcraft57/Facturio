import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export type Supplier = {
  id: number
  name: string
  legalName: string | null
  siret: string | null
  vatNumber: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  zipCode: string | null
  country: string
  paymentTermsDays: number
  iban: string | null
  bic: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
}

export type CreateSupplierPayload = {
  name: string
  legalName?: string
  siret?: string
  vatNumber?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  zipCode?: string
  country?: string
  paymentTermsDays?: number
  iban?: string
  bic?: string
  notes?: string
}

/**
 * Client API référentiel fournisseurs.
 */
export const suppliersService = {
  /** Liste les fournisseurs. */
  async list(activeOnly = false): Promise<Supplier[]> {
    const res = await apiClient.get(`/suppliers${activeOnly ? '?active=true' : ''}`)
    return unwrapApiPayload(res) as Supplier[]
  },

  /** Crée un fournisseur. */
  async create(payload: CreateSupplierPayload): Promise<Supplier> {
    const res = await apiClient.post('/suppliers', payload)
    apiClient.invalidateCache('/suppliers')
    return unwrapApiPayload(res) as Supplier
  },

  /** Met à jour un fournisseur. */
  async update(id: number, payload: Partial<CreateSupplierPayload>): Promise<Supplier> {
    const res = await apiClient.patch(`/suppliers/${id}`, payload)
    apiClient.invalidateCache('/suppliers')
    return unwrapApiPayload(res) as Supplier
  },

  /** Désactive un fournisseur. */
  async deactivate(id: number): Promise<Supplier> {
    const res = await apiClient.post(`/suppliers/${id}/deactivate`)
    apiClient.invalidateCache('/suppliers')
    return unwrapApiPayload(res) as Supplier
  },

  /** Crée le créancier lié pour une dette. */
  async linkCreditor(id: number): Promise<{ id: number; name: string }> {
    const res = await apiClient.post(`/suppliers/${id}/link-creditor`)
    return unwrapApiPayload(res) as { id: number; name: string }
  },
}
