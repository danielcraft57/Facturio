import { describe, it, expect } from 'vitest'
import { resolveQuoteDisplayStatus } from './quoteDisplayStatus'

describe('resolveQuoteDisplayStatus', () => {
  it('affiche Brouillon pour un devis DRAFT', () => {
    expect(resolveQuoteDisplayStatus({ status: 'DRAFT' }).label).toBe('Brouillon')
  })

  it('affiche Accepté / Refusé / Expiré selon le statut métier', () => {
    expect(resolveQuoteDisplayStatus({ status: 'ACCEPTED' }).label).toBe('Accepté')
    expect(resolveQuoteDisplayStatus({ status: 'REJECTED' }).label).toBe('Refusé')
    expect(resolveQuoteDisplayStatus({ status: 'EXPIRED' }).label).toBe('Expiré')
  })

  it('parcours email : Envoyé → Vu → Cliqué', () => {
    expect(
      resolveQuoteDisplayStatus({ status: 'SENT', emailSent: true }).label,
    ).toBe('Envoyé')
    expect(
      resolveQuoteDisplayStatus({ status: 'SENT', emailSent: true, emailOpened: true }).label,
    ).toBe('Vu')
    expect(
      resolveQuoteDisplayStatus({
        status: 'SENT',
        emailSent: true,
        emailOpened: true,
        emailClicked: true,
      }).label,
    ).toBe('Cliqué')
  })

  it('utilise emailEngagement en priorité sur les flags liste', () => {
    expect(
      resolveQuoteDisplayStatus({
        status: 'SENT',
        emailSent: false,
        emailEngagement: { emailSent: true, opened: true, clicked: false },
      }).label,
    ).toBe('Vu')
  })
})
