import { apiClient } from './api'

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
}

export const catalogService = new CatalogService()
