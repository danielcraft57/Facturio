import { describe, expect, it } from 'vitest'
import { isWelcomeCampaignActive, WELCOME_CAMPAIGN_END_ISO } from './welcomeCampaign'

describe('welcomeCampaign', () => {
  it('reste active avant fin septembre 2026', () => {
    expect(isWelcomeCampaignActive(new Date('2026-06-15T12:00:00Z'))).toBe(true)
    expect(isWelcomeCampaignActive(new Date(WELCOME_CAMPAIGN_END_ISO))).toBe(true)
  })

  it('se coupe après fin septembre 2026', () => {
    expect(isWelcomeCampaignActive(new Date('2026-10-01T00:00:00Z'))).toBe(false)
  })
})
