import { hasQuotaAlert } from './QuotaUsagePanel'
import type { BillingUsage } from '../../../services/billing'

function baseUsage(overrides: Partial<BillingUsage> = {}): BillingUsage {
  return {
    plan: 'FREE',
    planLabel: 'Free',
    limits: {
      plan: 'FREE',
      label: 'Free',
      maxInvoicesPerMonth: 25,
      maxQuotesPerMonth: 10,
      maxEmailsPerMonth: 20,
      pdfWatermark: true,
      publicApi: false,
      eInvoicing: false,
      stripePayments: true,
      multiUser: false,
      accounting: false,
      financeModule: false,
    },
    usage: { invoicesThisMonth: 0, quotesThisMonth: 0, emailsSentThisMonth: 0 },
    atLimit: false,
    atQuoteLimit: false,
    atEmailLimit: false,
    remainingInvoices: 25,
    remainingQuotes: 10,
    remainingEmails: 20,
    billingPeriod: {
      start: '2026-06-01T00:00:00.000Z',
      end: '2026-06-30T23:59:59.999Z',
      resetsAt: '2026-07-01T00:00:00.000Z',
    },
    subscription: null,
    betaTester: null,
    ...overrides,
  }
}

describe('hasQuotaAlert', () => {
  it('retourne false sur plan Pro', () => {
    expect(hasQuotaAlert(baseUsage({ plan: 'PRO' }))).toBe(false)
  })

  it('retourne true si quota factures atteint', () => {
    expect(
      hasQuotaAlert(
        baseUsage({
          usage: { invoicesThisMonth: 25, quotesThisMonth: 0, emailsSentThisMonth: 0 },
          atLimit: true,
        }),
      ),
    ).toBe(true)
  })

  it('retourne true à 80 % d’un quota', () => {
    expect(
      hasQuotaAlert(
        baseUsage({
          usage: { invoicesThisMonth: 20, quotesThisMonth: 0, emailsSentThisMonth: 0 },
        }),
      ),
    ).toBe(true)
  })

  it('retourne false en dessous du seuil', () => {
    expect(
      hasQuotaAlert(
        baseUsage({
          usage: { invoicesThisMonth: 5, quotesThisMonth: 1, emailsSentThisMonth: 2 },
        }),
      ),
    ).toBe(false)
  })
})
