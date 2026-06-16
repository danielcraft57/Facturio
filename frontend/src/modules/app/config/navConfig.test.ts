import { describe, expect, it } from 'vitest'
import {
  filterNavGroups,
  isNavItemVisibleForPlan,
  navGroups,
  navPlanFilterFromUsage,
} from './navConfig'
import type { BillingUsage } from '../../../services/billing'

const freeUsage = {
  plan: 'FREE',
  planLabel: 'Free',
  limits: {
    plan: 'FREE',
    label: 'Free',
    maxInvoicesPerMonth: 25,
    maxQuotesPerMonth: 10,
    maxEmailsPerMonth: 20,
    eInvoicing: false,
    stripePayments: true,
    multiUser: false,
    publicApi: false,
    accounting: false,
    financeModule: false,
    pdfWatermark: true,
  },
  usage: { invoicesThisMonth: 0, quotesThisMonth: 0, emailsSentThisMonth: 0 },
  billingPeriod: { start: '', end: '', resetsAt: '' },
  remainingInvoices: 25,
  remainingQuotes: 10,
  remainingEmails: 20,
  atLimit: false,
  atQuoteLimit: false,
  atEmailLimit: false,
  subscription: null,
} satisfies BillingUsage

const proUsage: BillingUsage = {
  ...freeUsage,
  plan: 'PRO',
  planLabel: 'Pro',
  limits: {
    ...freeUsage.limits,
    plan: 'PRO',
    label: 'Pro',
    maxInvoicesPerMonth: null,
    maxQuotesPerMonth: null,
    maxEmailsPerMonth: null,
    publicApi: true,
    accounting: true,
    financeModule: true,
    pdfWatermark: false,
  },
  remainingInvoices: null,
  remainingQuotes: null,
  remainingEmails: null,
}

describe('navPlanFilterFromUsage', () => {
  it('désactive compta et finance sur plan Free', () => {
    expect(navPlanFilterFromUsage(freeUsage)).toEqual({
      accountingEnabled: false,
      financeModuleEnabled: false,
    })
  })

  it('active compta et finance sur plan Pro', () => {
    expect(navPlanFilterFromUsage(proUsage)).toEqual({
      accountingEnabled: true,
      financeModuleEnabled: true,
    })
  })
})

describe('filterNavGroups', () => {
  it('garde créances, dettes et Finance visibles en Free avec badge Pro verrouillé', () => {
    const filtered = filterNavGroups(navGroups, navPlanFilterFromUsage(freeUsage))
    const commercial = filtered.find((g) => g.id === 'commercial')
    const finance = filtered.find((g) => g.id === 'finance')

    const creances = commercial?.items.find((i) => i.to === '/creances')
    const dettes = commercial?.items.find((i) => i.to === '/dettes/inbox')
    const compta = finance?.items.find((i) => i.to === '/comptabilite')

    expect(creances?.badge).toBe('Pro')
    expect(creances?.planLocked).toBe(true)
    expect(dettes?.planLocked).toBe(true)
    expect(finance?.items).toHaveLength(4)
    expect(compta?.planLocked).toBe(true)
    expect(commercial?.items.some((i) => i.to === '/factures/inbox' && !i.planLocked)).toBe(true)
  })

  it('déverrouille les modules sur plan Pro', () => {
    const filtered = filterNavGroups(navGroups, navPlanFilterFromUsage(proUsage))
    const creances = filtered
      .find((g) => g.id === 'commercial')
      ?.items.find((i) => i.to === '/creances')

    expect(creances?.badge).toBe('Pro')
    expect(creances?.planLocked).toBe(false)
  })
})

describe('isNavItemVisibleForPlan', () => {
  it('laisse passer les entrées sans restriction', () => {
    const item = navGroups[0].items[0]
    expect(isNavItemVisibleForPlan(item, {})).toBe(true)
  })
})
