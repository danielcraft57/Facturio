import { AGING_BUCKET_LABELS, payableStatusLabel } from '../financeLabels'

describe('financeLabels', () => {
  it('libellés aging', () => {
    expect(AGING_BUCKET_LABELS.not_due).toBe('À échoir')
    expect(AGING_BUCKET_LABELS.days_90_plus).toBe('+90 j')
  })

  it('statut dette payable', () => {
    expect(payableStatusLabel('OPEN')).toBe('Ouverte')
    expect(payableStatusLabel('PAID')).toBe('Payée')
  })
})
