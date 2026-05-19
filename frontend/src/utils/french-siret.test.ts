import { describe, it, expect } from 'vitest'
import {
  formatSiren,
  formatSiret,
  isValidSiren,
  isValidSiret,
  passesLuhnCheck,
  sirenFromSiret,
} from './french-siret'

describe('french-siret', () => {
  it('formate SIREN et SIRET', () => {
    expect(formatSiren('443061841')).toBe('443 061 841')
    expect(formatSiret('35600000000048')).toBe('356 000 000 00048')
  })

  it('valide La Poste (exemple INSEE)', () => {
    expect(passesLuhnCheck('356000000')).toBe(true)
    expect(isValidSiren('356000000')).toBe(true)
    expect(isValidSiret('35600000000048')).toBe(true)
  })

  it('rejette une clé Luhn incorrecte', () => {
    expect(isValidSiren('123456789')).toBe(false)
    expect(isValidSiret('12345678901234')).toBe(false)
  })

  it('extrait le SIREN du SIRET', () => {
    expect(sirenFromSiret('356 000 000 00048')).toBe('356000000')
  })
})
