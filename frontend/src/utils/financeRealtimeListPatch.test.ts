import { describe, expect, it } from 'vitest'
import { patchInvoiceFromRealtimeDetail } from './financeRealtimeListPatch'
import type { Invoice } from '../services/invoices'

const baseInvoice: Invoice = {
  id: 'inv-1',
  number: 'ACO-001',
  status: 'sent',
  balance: 120,
  total: 120,
  clientId: 'c1',
  client: { id: 'c1', name: 'Client', email: 'client@example.com' },
  issueDate: '2026-01-01',
  dueDate: '2026-02-01',
  items: [],
  subtotal: 100,
  taxTotal: 20,
  currency: 'EUR',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('patchInvoiceFromRealtimeDetail', () => {
  it('met le solde à 0 quand la facture est payée', () => {
    const patched = patchInvoiceFromRealtimeDetail(baseInvoice, {
      resource: 'invoices',
      action: 'paid',
      id: 'inv-1',
      number: 'ACO-001',
      status: 'PAID',
      tone: 'paid',
    })
    expect(patched.status).toBe('paid')
    expect(patched.balance).toBe(0)
  })
})
