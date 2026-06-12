import { describe, expect, it } from 'vitest'
import {
  formatInstallmentAccountingLabel,
  formatInstallmentReceivableLabel,
} from './installmentFinanceLabels'

describe('installmentFinanceLabels', () => {
  it('formate une écriture postée', () => {
    expect(
      formatInstallmentAccountingLabel('BQ', 'PAIEMENT FAC-2026-001#12', true),
    ).toContain('BQ')
    expect(
      formatInstallmentAccountingLabel('BQ', 'PAIEMENT FAC-2026-001#12', true),
    ).toContain('PAIEMENT')
  })

  it('indique une écriture en attente', () => {
    expect(formatInstallmentAccountingLabel('VE', 'VENTE FAC-001', false)).toBe(
      'VE · en attente',
    )
  })

  it('formate une créance auto en retard', () => {
    expect(formatInstallmentReceivableLabel('days_0_30', 5)).toBe(
      'Créance auto · 5 j de retard',
    )
  })

  it('formate une créance à échoir', () => {
    expect(formatInstallmentReceivableLabel('not_due', 0)).toBe('Créance auto · à échoir')
  })
})
