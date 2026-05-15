import { apiClient, type ApiResponse } from './api'

// Types pour les clients
export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  company?: {
    name: string
    siret?: string
    tva?: string
  }
  status: 'active' | 'inactive' | 'prospect'
  createdAt: string
  updatedAt: string
}

export interface CreateClientData {
  name: string
  email: string
  phone?: string
  address?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  company?: {
    name: string
    siret?: string
    tva?: string
  }
  status?: 'active' | 'inactive' | 'prospect'
}

export interface UpdateClientData extends Partial<CreateClientData> {
  id: string
}

export interface ClientFilters {
  search?: string
  status?: Client['status']
  page?: number
  limit?: number
  sortBy?: 'name' | 'email' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ClientListResponse {
  clients: Client[]
  items?: Client[]
  total: number
  page: number
  limit: number
  pageSize?: number
  totalPages: number
}

/** Déballage réponse NestJS + intercepteur axios. */
export function unwrapApiPayload<T>(response: unknown): T {
  const raw: any = (response as any)?.data ?? response
  return (raw?.data ?? raw) as T
}

/** Mappe un client API (Prisma) vers le modèle UI. */
export function mapApiClientToClient(c: Record<string, unknown>, uiStatus?: Client['status']): Client {
  const addressStr = typeof c.address === 'string' ? c.address : undefined
  return {
    id: String(c.id),
    name: String(c.name || c.companyName || ''),
    email: String(c.email || ''),
    phone: typeof c.phone === 'string' ? c.phone : undefined,
    address: addressStr
      ? { street: addressStr, city: '', postalCode: '', country: String(c.countryCode || 'FR') }
      : undefined,
    company: c.companyName
      ? { name: String(c.companyName), siret: undefined, tva: c.vatNumber ? String(c.vatNumber) : undefined }
      : undefined,
    status: uiStatus || (c.status as Client['status']) || 'active',
    createdAt: String(c.createdAt || new Date().toISOString()),
    updatedAt: String(c.updatedAt || new Date().toISOString()),
  }
}

export function parseClientsListResponse(response: unknown): Client[] {
  const payload = unwrapApiPayload<{ items?: unknown[]; clients?: unknown[] }>(response)
  const list = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.clients)
      ? payload.clients
      : Array.isArray(payload)
        ? payload
        : []
  return list.map((c) => mapApiClientToClient(c as Record<string, unknown>))
}

/** Corps attendu par POST /api/clients */
export function toCreateClientPayload(data: {
  name: string
  email: string
  phone?: string
  address?: string
  isCompany?: boolean
  companyName?: string
}): Record<string, unknown> {
  const name = data.name.trim()
  return {
    name,
    email: data.email.trim(),
    address: data.address?.trim() || undefined,
    isCompany: data.isCompany ?? !!data.companyName,
    companyName: data.companyName?.trim() || (data.isCompany ? name : undefined),
    countryCode: 'FR',
  }
}

// Service pour les clients
export class ClientService {
  private baseUrl = '/clients'

  // Récupérer la liste des clients avec filtres
  async getClients(filters: ClientFilters = {}): Promise<ApiResponse<ClientListResponse>> {
    const params = new URLSearchParams()
    
    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

    const queryString = params.toString()
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl

    return apiClient.getCached<ClientListResponse>(url, 2 * 60 * 1000) // Cache 2 minutes
  }

  // Récupérer un client par ID
  async getClient(id: string): Promise<ApiResponse<Client>> {
    return apiClient.getCached<Client>(`${this.baseUrl}/${id}`, 5 * 60 * 1000) // Cache 5 minutes
  }

  // Créer un nouveau client
  async createClient(data: CreateClientData): Promise<ApiResponse<Client>> {
    const response = await apiClient.post<Client>(this.baseUrl, data)
    
    // Invalider le cache des listes
    apiClient.invalidateCache('/clients')
    
    return response
  }

  // Mettre à jour un client
  async updateClient(data: UpdateClientData): Promise<ApiResponse<Client>> {
    const { id, ...updateData } = data
    const response = await apiClient.put<Client>(`${this.baseUrl}/${id}`, updateData)
    
    // Invalider les caches
    apiClient.invalidateCache('/clients')
    apiClient.invalidateCache(`/clients/${id}`)
    
    return response
  }

  // Supprimer un client
  async deleteClient(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`${this.baseUrl}/${id}`)
    
    // Invalider les caches
    apiClient.invalidateCache('/clients')
    apiClient.invalidateCache(`/clients/${id}`)
    
    return response
  }

  // Rechercher des clients
  async searchClients(query: string): Promise<ApiResponse<Client[]>> {
    return apiClient.get<Client[]>(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`)
  }

  // Importer des clients depuis un fichier CSV
  async importClients(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<{ imported: number; errors: string[] }>> {
    return apiClient.upload<{ imported: number; errors: string[] }>(`${this.baseUrl}/import`, file, onProgress)
  }

  // Exporter les clients en CSV
  async exportClients(filters?: ClientFilters): Promise<Blob> {
    const params = new URLSearchParams()
    
    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)

    const queryString = params.toString()
    const url = queryString ? `${this.baseUrl}/export?${queryString}` : `${this.baseUrl}/export`

    const response = await apiClient.client.get(url, {
      responseType: 'blob',
    })

    return response.data
  }

  // Fusionner deux clients
  async mergeClients(sourceId: string, targetId: string): Promise<ApiResponse<Client>> {
    const response = await apiClient.post<Client>(`${this.baseUrl}/${targetId}/merge`, {
      sourceClientId: sourceId,
    })
    
    // Invalider les caches
    apiClient.invalidateCache('/clients')
    apiClient.invalidateCache(`/clients/${sourceId}`)
    apiClient.invalidateCache(`/clients/${targetId}`)
    
    return response
  }

  // Récupérer les statistiques des clients
  async getClientStats(): Promise<ApiResponse<{
    total: number
    active: number
    inactive: number
    prospects: number
    newThisMonth: number
    topClients: Array<{ client: Client; revenue: number }>
  }>> {
    return apiClient.getCached(`${this.baseUrl}/stats`, 10 * 60 * 1000) // Cache 10 minutes
  }
}

// Instance singleton
export const clientService = new ClientService()
