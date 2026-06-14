import { describe, expect, it, beforeEach } from 'vitest'
import { hasSeenWelcomeCampaign, markWelcomeCampaignSeen } from './welcomeCampaignStorage'
import { welcomeCampaignStorageKey } from '../config/welcomeCampaign'

describe('welcomeCampaignStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('marque la popin comme vue par utilisateur', () => {
    expect(hasSeenWelcomeCampaign(42)).toBe(false)
    markWelcomeCampaignSeen(42)
    expect(hasSeenWelcomeCampaign(42)).toBe(true)
    expect(localStorage.getItem(welcomeCampaignStorageKey(42))).toBe('1')
    expect(hasSeenWelcomeCampaign(99)).toBe(false)
  })
})
