import { formatCurrency, formatPercent, formatShortDate } from '../format'

describe('formatCurrency', () => {
  it('formate en euros FR', () => {
    expect(formatCurrency(1234.5)).toMatch(/1[\s\u202f]?234,50/)
    expect(formatCurrency(1234.5)).toContain('€')
  })
})

describe('formatPercent', () => {
  it('ajoute le signe + pour les valeurs positives', () => {
    expect(formatPercent(18.6)).toBe('+18.6 %')
  })

  it('garde le signe négatif', () => {
    expect(formatPercent(-3.2)).toBe('-3.2 %')
  })
})

describe('formatShortDate', () => {
  it('formate une date ISO', () => {
    const out = formatShortDate('2024-06-15T12:00:00.000Z')
    expect(out).toMatch(/15/)
    expect(out).toMatch(/2024/)
  })

  it('retourne un tiret si la date est invalide', () => {
    expect(formatShortDate(undefined)).toBe('—')
    expect(formatShortDate('not-a-date')).toBe('—')
  })
})
