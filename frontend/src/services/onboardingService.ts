import { apiClient } from './api'
import type { TechStackChoices } from './catalogService'

export type OnboardingStatus = {
  completed: boolean
  onboardingCompletedAt: string | null
  preferredTechnologies: string[]
  productCount: number
}

export type OnboardingPreviewProduct = {
  id: number
  name: string
  sku: string | null
  unitPrice: string | number | null
  languages: unknown
  description: string | null
}

function unwrap<T>(response: { data: unknown }): T {
  const d = response.data
  if (d && typeof d === 'object' && 'data' in (d as object)) {
    return (d as { data: T }).data
  }
  return d as T
}

class OnboardingService {
  async getStatus(): Promise<OnboardingStatus> {
    const res = await apiClient.get<OnboardingStatus>('/onboarding/status')
    return unwrap<OnboardingStatus>(res)
  }

  async getTechChoices(): Promise<TechStackChoices> {
    const res = await apiClient.get<TechStackChoices>('/onboarding/tech-choices')
    return unwrap<TechStackChoices>(res)
  }

  async preview(technologyIds: string[]): Promise<{
    technologyIds: string[]
    products: OnboardingPreviewProduct[]
    total: number
  }> {
    const res = await apiClient.post('/onboarding/preview', { technologyIds })
    return unwrap(res)
  }

  async install(technologyIds: string[]): Promise<{
    message: string
    clonedCount: number
    productIds: number[]
    skus: string[]
  }> {
    const res = await apiClient.post('/onboarding/install', { technologyIds })
    return unwrap(res)
  }
}

export const onboardingService = new OnboardingService()
