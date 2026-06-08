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

export type OrganizationCatalog = {
  productIds: number[]
  preferredTechnologies: string[]
}

export type RegenerateOrganizationCatalogResult = {
  message: string
  clonedCount: number
  productIds: number[]
  skus: string[]
  matchScores: Record<number, number>
}

function unwrap<T>(response: { data: unknown }): T {
  const d = response.data
  if (d && typeof d === 'object' && 'data' in (d as object)) {
    return (d as { data: T }).data
  }
  return d as T
}

const TECH_CHOICES_TTL_MS = 10 * 60 * 1000

let techChoicesMemory: TechStackChoices | null = null
let techChoicesInflight: Promise<TechStackChoices> | null = null

class CatalogService {
  async getTechChoices(): Promise<TechStackChoices> {
    if (techChoicesMemory) return techChoicesMemory
    if (techChoicesInflight) return techChoicesInflight

    techChoicesInflight = (async () => {
      const res = await apiClient.getCached<TechStackChoices>(
        '/catalog/tech-choices',
        TECH_CHOICES_TTL_MS,
      )
      const data = unwrap<TechStackChoices>(res)
      techChoicesMemory = data
      return data
    })().finally(() => {
      techChoicesInflight = null
    })

    return techChoicesInflight
  }

  /** Précharge en arrière-plan (login, ouverture formulaire produit). */
  prefetchTechChoices(): Promise<TechStackChoices> {
    return this.getTechChoices()
  }

  /** Tests uniquement. */
  static resetTechChoicesCacheForTests(): void {
    techChoicesMemory = null
    techChoicesInflight = null
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

  async getOrganizationCatalog(): Promise<OrganizationCatalog> {
    const res = await apiClient.get<OrganizationCatalog>('/catalog/organization')
    return unwrap<OrganizationCatalog>(res)
  }

  async regenerateOrganizationCatalog(
    technologyIds: string[],
  ): Promise<RegenerateOrganizationCatalogResult> {
    const res = await apiClient.post<RegenerateOrganizationCatalogResult>(
      '/catalog/organization/regenerate',
      { technologyIds },
    )
    return unwrap<RegenerateOrganizationCatalogResult>(res)
  }
}

export const catalogService = new CatalogService()
