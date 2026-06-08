import { describe, expect, it } from 'vitest'
import {
  API_DOC_SECTIONS,
  API_SCOPES_REFERENCE,
  buildCurlExample,
  formatDocUrl,
  getApiDocSectionColor,
  normalizeApiBaseUrl,
} from './apiDocsContent'

describe('apiDocsContent', () => {
  it('expose toutes les sections documentées', () => {
    const ids = API_DOC_SECTIONS.map((s) => s.id)
    expect(ids).toContain('overview')
    expect(ids).toContain('factures')
    expect(ids).toContain('auth')
    expect(ids).toContain('paid-externe')
    expect(ids).not.toContain('errors')
  })

  it('buildCurlExample inclut Bearer et JSON pour POST', () => {
    const curl = buildCurlExample('POST', '/public/factures', '{"a":1}', 'https://api.test/api')
    expect(curl).toContain('Authorization: Bearer')
    expect(curl).toContain('https://api.test/api/public/factures')
    expect(curl).toContain('application/json')
  })

  it('référence les scopes factures', () => {
    const scopes = API_SCOPES_REFERENCE.map((s) => s.id)
    expect(scopes).toContain('factures.send')
    expect(scopes).toContain('devis.write')
  })

  it('documente les parcours devis productSku et import catalogue', () => {
    const ids = API_DOC_SECTIONS.map((s) => s.id)
    expect(ids).toContain('catalog-import')
    expect(ids).toContain('livrables')
    const devis = API_DOC_SECTIONS.find((s) => s.id === 'devis')
    expect(devis?.body).toContain('productSku')
    expect(devis?.exampleBody).toContain('productSku')
    const livrables = API_DOC_SECTIONS.find((s) => s.id === 'livrables')
    expect(livrables?.endpoints?.[0]?.path).toBe('/public/produits/livrables/catalog')
  })

  it('normalise une base /v1 vers /api', () => {
    expect(normalizeApiBaseUrl('https://api.facturio.com/v1')).toBe('https://api.facturio.com/api')
    expect(formatDocUrl('https://api.facturio.com/v1', '/public/clients')).toBe(
      'https://api.facturio.com/api/public/clients',
    )
  })

  it('chaque section avec exampleBody a un exampleCurl cohérent', () => {
    const pathBySection: Record<string, string> = {
      clients: '/public/clients',
      produits: '/public/produits',
      factures: '/public/factures',
      devis: '/public/devis',
      'paid-externe': '/public/factures',
    }
    for (const section of API_DOC_SECTIONS) {
      if (!section.exampleBody || !section.exampleCurl) continue
      expect(section.exampleCurl.path).toBe(pathBySection[section.id])
    }
  })

  it('auth utilise GET /public (pas d’URL figée à l’import)', () => {
    const auth = API_DOC_SECTIONS.find((s) => s.id === 'auth')
    expect(auth?.exampleBody).toBeUndefined()
    expect(auth?.exampleCurl?.path).toBe('/public')
  })

  it('associe une couleur à chaque section du sommaire', () => {
    for (const section of API_DOC_SECTIONS) {
      expect(getApiDocSectionColor(section.id)).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
