import { describe, expect, it } from 'vitest'
import {
  previewInstallmentWithDeposit,
  resolveInitialInstallmentPayment,
} from './quoteSmartInstallment'

describe('quoteSmartInstallment', () => {
  const preview = [
    { sequence: 1, amount: 396, dueDate: '2026-07-12T00:00:00.000Z' },
    { sequence: 2, amount: 396, dueDate: '2026-08-12T00:00:00.000Z' },
    { sequence: 3, amount: 396, dueDate: '2026-09-12T00:00:00.000Z' },
  ]

  it('previewInstallmentWithDeposit — 1re mensualité réduite après acompte ACO', () => {
    const rows = previewInstallmentWithDeposit(preview, 1188, 0.1)
    expect(rows[0].label).toBe('Acompte (ACO)')
    expect(rows[1].amount).toBeCloseTo(277.2, 2)
    const sum = rows.slice(1).reduce((s, r) => s + r.amount, 0)
    expect(sum).toBeCloseTo(1069.2, 2)
  })

  it('resolveInitialInstallmentPayment — acompte ou 1re mensualité', () => {
    expect(resolveInitialInstallmentPayment(1188, preview, true, 0.1)).toBeCloseTo(118.8, 2)
    expect(resolveInitialInstallmentPayment(1188, preview, false)).toBe(396)
  })
})
