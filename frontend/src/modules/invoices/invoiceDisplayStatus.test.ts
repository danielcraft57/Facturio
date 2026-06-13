import { describe, it, expect } from 'vitest'
import { resolveInvoiceDisplayStatus } from './invoiceDisplayStatus'

describe('resolveInvoiceDisplayStatus', () => {
  it('affiche Brouillon, Payée, En retard, Annulée', () => {
    expect(resolveInvoiceDisplayStatus({ status: 'draft' }).label).toBe('Brouillon')
    expect(resolveInvoiceDisplayStatus({ status: 'paid' }).label).toBe('Payée')
    expect(resolveInvoiceDisplayStatus({ status: 'overdue' }).label).toBe('En retard')
    expect(resolveInvoiceDisplayStatus({ status: 'cancelled' }).label).toBe('Annulée')
  })

  it('parcours email : Envoyée → Vu → Cliqué', () => {
    expect(
      resolveInvoiceDisplayStatus({ status: 'sent', emailSent: true }).label,
    ).toBe('Envoyée')
    expect(
      resolveInvoiceDisplayStatus({ status: 'sent', emailSent: true, emailOpened: true }).label,
    ).toBe('Vu')
    expect(
      resolveInvoiceDisplayStatus({
        status: 'sent',
        emailSent: true,
        emailOpened: true,
        emailClicked: true,
      }).label,
    ).toBe('Cliqué')
  })

  it('Payée prime sur le suivi email', () => {
    expect(
      resolveInvoiceDisplayStatus({
        status: 'paid',
        emailSent: true,
        emailOpened: true,
        emailClicked: true,
      }).label,
    ).toBe('Payée')
  })

  it('affiche le progrès échéancier avant le statut email Cliqué', () => {
    expect(
      resolveInvoiceDisplayStatus({
        status: 'sent',
        total: 702,
        balance: 390,
        emailClicked: true,
        installmentSummary: {
          hasPlan: true,
          totalCount: 2,
          pendingCount: 1,
          paidCount: 1,
          nextSequence: 2,
          nextAmount: 390,
          nextDueDate: '2026-08-13',
          hasOverdue: false,
        },
      }).label,
    ).toBe('1/2 payée')
  })
})
