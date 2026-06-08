import { describe, expect, it } from 'vitest'
import {
  filterSuggestedTechIds,
  normalizeOnboardingProfileId,
  resolveOnboardingProfile,
} from './onboardingProfiles'

describe('onboardingProfiles', () => {
  it('normalise les anciens ids de profil', () => {
    expect(normalizeOnboardingProfileId('freelance')).toBe('freelance-dev')
    expect(normalizeOnboardingProfileId('student')).toBe('student-dev')
    expect(normalizeOnboardingProfileId('commercial')).toBe('commercial')
  })

  it('filtre les couches techno selon le profil design', () => {
    const profile = resolveOnboardingProfile('webdesigner')
    expect(profile?.techCategories).toContain('cms')
    expect(profile?.techCategories).not.toContain('cybersecurity')
  })

  it('suggère des technos valides pour un profil communication', () => {
    const valid = new Set(['wordpress', 'chatgpt', 'claude', 'n8n'])
    const suggested = filterSuggestedTechIds('redacteur', valid)
    expect(suggested).toEqual(['wordpress', 'chatgpt', 'claude'])
  })
})
