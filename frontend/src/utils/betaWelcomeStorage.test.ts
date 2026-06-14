import { describe, expect, it } from 'vitest'
import {
  BETA_WELCOME_STORAGE_PREFIX,
  hasSeenBetaWelcome,
  markBetaWelcomeSeen,
} from './betaWelcomeStorage'

describe('betaWelcomeStorage', () => {
  it('marque la popin beta comme vue', () => {
    const userId = `test-beta-${Date.now()}`
    expect(hasSeenBetaWelcome(userId)).toBe(false)
    markBetaWelcomeSeen(userId)
    expect(hasSeenBetaWelcome(userId)).toBe(true)
    expect(localStorage.getItem(`${BETA_WELCOME_STORAGE_PREFIX}_${userId}`)).toBe('1')
  })
})
