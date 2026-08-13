import { apiClient } from './api'

export type ApiScope =
  | 'clients.read'
  | 'clients.write'
  | 'produits.read'
  | 'produits.write'
  | 'factures.read'
  | 'factures.write'
  | 'factures.send'
  | 'factures.refund'
  | 'devis.read'
  | 'devis.write'
  | 'devis.send'

export interface ApiScopeCatalogItem {
  id: ApiScope
  label: string
}

export interface ApiAccessTokenRow {
  id: number
  name: string
  tokenPrefix: string
  permissions: ApiScope[]
  lastUsedAt?: string | null
  createdAt: string
}

export interface CreateApiTokenResult extends ApiAccessTokenRow {
  token: string
}

function unwrap<T>(response: unknown): T {
  const raw: unknown = (response as { data?: unknown })?.data ?? response
  if (raw && typeof raw === 'object' && 'success' in raw) {
    const r = raw as { success?: boolean; data?: T; error?: string; message?: string }
    if (r.success === false) throw new Error(r.error || r.message || 'Erreur API')
    if (r.data !== undefined) return r.data
  }
  return raw as T
}

class ApiAccessServiceClass {
  async getCatalog(): Promise<{ scopes: ApiScopeCatalogItem[]; docsUrl: string; tokensUrl: string }> {
    const res = await apiClient.get('/api-access/tokens/catalog')
    return unwrap(res)
  }

  async listTokens(): Promise<ApiAccessTokenRow[]> {
    const res = await apiClient.get('/api-access/tokens')
    return unwrap(res)
  }

  async createToken(name: string, permissions: ApiScope[]): Promise<CreateApiTokenResult> {
    const res = await apiClient.post('/api-access/tokens', { name, permissions })
    return unwrap(res)
  }

  async revokeToken(id: number): Promise<void> {
    await apiClient.delete(`/api-access/tokens/${id}`)
  }
}

export const apiAccessService = new ApiAccessServiceClass()
