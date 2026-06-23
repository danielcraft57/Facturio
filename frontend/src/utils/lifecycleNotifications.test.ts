import { describe, expect, it } from 'vitest'
import {
  resolveBetaLifecyclePhase,
  betaLifecycleNoticeCopy,
  onboardingInstalledNoticeCopy,
} from './lifecycleNotifications'

describe('resolveBetaLifecyclePhase', () => {
  it('retourne 60d quand il reste ~2 mois', () => {
    expect(
      resolveBetaLifecyclePhase({
        active: true,
        startedAt: '2026-03-01T00:00:00.000Z',
        expiresAt: '2026-08-01T00:00:00.000Z',
        daysRemaining: 55,
      }),
    ).toBe('60d')
  })

  it('retourne expired si beta inactive', () => {
    expect(
      resolveBetaLifecyclePhase({
        active: false,
        startedAt: '2026-01-01T00:00:00.000Z',
        expiresAt: '2026-04-01T00:00:00.000Z',
        daysRemaining: 0,
      }),
    ).toBe('expired')
  })
})

describe('betaLifecycleNoticeCopy', () => {
  it('précise conformité et plateforme non activée pour la phase 60d', () => {
    const copy = betaLifecycleNoticeCopy('60d')
    expect(copy.message).toMatch(/conformité/)
    expect(copy.message).toMatch(/plateforme agréée/i)
    expect(copy.message).not.toMatch(/Factur-X/)
  })
})

describe('onboardingInstalledNoticeCopy', () => {
  it('pluralise les prestations', () => {
    expect(onboardingInstalledNoticeCopy(3).message).toContain('3 prestations')
  })
})
