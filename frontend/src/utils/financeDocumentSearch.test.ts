import { describe, expect, it } from 'vitest'
import {
  buildInvoiceSearchEntry,
  filterFinanceSearchOptions,
  matchesDocumentSearch,
  parseAmountFromToken,
  tokenizeSearchQuery,
} from './financeDocumentSearch'

describe('financeDocumentSearch', () => {
  it('tokenise les requêtes multi-mots', () => {
    expect(tokenizeSearchQuery('fac 20€ payé')).toEqual(['fac', '20€', 'payé'])
  })

  it('parse les montants', () => {
    expect(parseAmountFromToken('20€')).toBe(20)
    expect(parseAmountFromToken('20,50')).toBeCloseTo(20.5)
  })

  it('matche n°, montant et statut avec faute légère', () => {
    const { searchable } = buildInvoiceSearchEntry(
      {
        id: '1',
        number: 'FAC-2024-001',
        status: 'paid',
        total: 20,
        client: { name: 'Dupont' },
      },
      'Payée',
    )
    expect(matchesDocumentSearch(searchable, 'fac 20 paye')).toBe(true)
    expect(matchesDocumentSearch(searchable, 'fac 99 paye')).toBe(false)
  })

  it('filtre et trie les options autocomplete', () => {
    const a = buildInvoiceSearchEntry(
      {
        id: '1',
        number: 'FAC-001',
        status: 'paid',
        total: 20,
        client: { name: 'A' },
      },
      'Payée',
    ).option
    const b = buildInvoiceSearchEntry(
      {
        id: '2',
        number: 'FAC-002',
        status: 'draft',
        total: 100,
        client: { name: 'B' },
      },
      'Brouillon',
    ).option
    const out = filterFinanceSearchOptions([a, b], 'fac 20 paye', 5)
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('1')
  })
})
