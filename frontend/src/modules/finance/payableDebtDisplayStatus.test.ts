import { describe, expect, it } from 'vitest'
import { resolvePayableDebtDisplayStatus } from './payableDebtDisplayStatus'

describe('resolvePayableDebtDisplayStatus', () => {
  it('affiche Soldée et Annulée indépendamment de l’email', () => {
    expect(resolvePayableDebtDisplayStatus({ status: 'PAID', emailSent: true }).label).toBe(
      'Soldée',
    )
    expect(resolvePayableDebtDisplayStatus({ status: 'CANCELLED' }).label).toBe('Annulée')
  })

  it('priorise le parcours email', () => {
    expect(resolvePayableDebtDisplayStatus({ status: 'OPEN', emailSent: true }).label).toBe('Envoyé')
    expect(
      resolvePayableDebtDisplayStatus({ status: 'OPEN', emailSent: true, emailOpened: true }).label,
    ).toBe('Vu')
    expect(
      resolvePayableDebtDisplayStatus({
        status: 'OPEN',
        emailSent: true,
        emailOpened: true,
        emailClicked: true,
      }).label,
    ).toBe('Cliqué')
  })
})
