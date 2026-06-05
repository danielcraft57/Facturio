import { describe, expect, it } from 'vitest'
import { validatePayablePaymentAmount } from './payableDebtPaymentValidation'

describe('validatePayablePaymentAmount', () => {
  it('refuse un montant supérieur au solde', () => {
    expect(validatePayablePaymentAmount(50, 40, { status: 'OPEN' })).toMatch(/dépasser/)
  })

  it('accepte un montant dans la limite', () => {
    expect(validatePayablePaymentAmount(40, 40, { status: 'PARTIAL' })).toBeNull()
  })

  it('refuse si dette soldée', () => {
    expect(validatePayablePaymentAmount(10, 0, { status: 'PAID' })).toMatch(/soldée/)
  })
})
