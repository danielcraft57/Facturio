import { describe, expect, it } from 'vitest'
import {
  previewInstallmentWithDeposit,
  resolveInitialInstallmentPayment,
} from './quoteSmartInstallment'

describe('quoteSmartInstallment', () => {
  const preview = [
    { sequence: 1, amount: 594, dueDate: '2026-07-12T00:00:00.000Z' },
    { sequence: 2, amount: 594, dueDate: '2026-08-12T00:00:00.000Z' },
  ]

  it('previewInstallmentWithDeposit — acompte séparé puis mensualités', () => {
    const rows = previewInstallmentWithDeposit(preview, 1188, 0.1)
    expect(rows[0].label).toBe('Acompte')
    expect(rows[0].amount).toBeCloseTo(118.8, 2)
    expect(rows).toHaveLength(3)
    expect(rows.reduce((s, r) => s + r.amount, 0)).toBeCloseTo(1188, 2)
  })

  it('resolveInitialInstallmentPayment — acompte ou 1re échéance', () => {
    expect(resolveInitialInstallmentPayment(1188, preview, true, 0.1)).toBeCloseTo(118.8, 2)
    expect(resolveInitialInstallmentPayment(1188, preview, false)).toBe(594)
  })
})
