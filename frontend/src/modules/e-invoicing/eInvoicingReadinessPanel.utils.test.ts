import { describe, expect, it } from 'vitest'
import { shouldHideDashboardReadinessPanel } from './eInvoicingReadinessPanel.utils'

describe('shouldHideDashboardReadinessPanel', () => {
  it('masque le cadre dashboard si le profil émetteur est complet', () => {
    expect(
      shouldHideDashboardReadinessPanel({
        compact: true,
        org: { ready: true, score: 100, checks: [], planAllowsEInvoicing: false, paConnected: false, message: '' },
      }),
    ).toBe(true)
  })

  it('affiche le cadre si des champs manquent', () => {
    expect(
      shouldHideDashboardReadinessPanel({
        compact: true,
        org: { ready: false, score: 60, checks: [], planAllowsEInvoicing: false, paConnected: false, message: '' },
      }),
    ).toBe(false)
  })

  it('ne masque pas sur une fiche facture', () => {
    expect(
      shouldHideDashboardReadinessPanel({
        compact: false,
        invoiceId: 12,
        org: { ready: true, score: 100, checks: [], planAllowsEInvoicing: true, paConnected: false, message: '' },
      }),
    ).toBe(false)
  })
})
