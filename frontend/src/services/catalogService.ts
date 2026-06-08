import { apiClient } from './api'
import { unwrapApiPayload } from './clients'

export type TechStackOption = {
  id: string
  label: string
  matchTags: string[]
}

export type TechStackCategory = {
  id: string
  label: string
  hint?: string
  maxSelect?: number
  options: TechStackOption[]
}

export type TechStackChoices = {
  version: number
  audience: string
  title: string
  subtitle: string
  minTotalSelect: number
  maxTotalSelect: number
  categories: TechStackCategory[]
}

export type CatalogPackAudience = 'all' | 'junior'

export type CatalogPack = {
  id: string
  name: string
  description: string
  priceHint: string
  skus: string[]
  audience?: CatalogPackAudience
  suggestedProfiles?: string[]
}

export type CatalogPackInstallResult = {
  packId: string
  clonedCount: number
  skippedCount: number
  skus: string[]
  missingSkus: string[]
}

function unwrap<T>(response: { data: unknown }): T {
  const d = response.data
  if (d && typeof d === 'object' && 'data' in (d as object)) {
    return (d as { data: T }).data
  }
  return d as T
}

class CatalogService {
  async getTechChoices(): Promise<TechStackChoices> {
    const res = await apiClient.get<TechStackChoices>('/catalog/tech-choices')
    return unwrap<TechStackChoices>(res)
  }

  async listPacks(): Promise<CatalogPack[]> {
    const res = await apiClient.get<{ packs: CatalogPack[] }>('/catalog/packs')
    const body = unwrap<{ packs: CatalogPack[] }>(res)
    return body.packs ?? []
  }

  async installPack(packId: string): Promise<CatalogPackInstallResult> {
    const res = await apiClient.post<CatalogPackInstallResult>(`/catalog/packs/${packId}/install`, {})
    return unwrapApiPayload<CatalogPackInstallResult>(res)
  }
}

export const catalogService = new CatalogService()
