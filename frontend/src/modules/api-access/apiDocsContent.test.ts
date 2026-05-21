import { describe, expect, it } from 'vitest'
import {
  API_DOC_SECTIONS,
  API_SCOPES_REFERENCE,
  buildCurlExample,
} from './apiDocsContent'

describe('apiDocsContent', () => {
  it('expose toutes les sections documentées', () => {
    const ids = API_DOC_SECTIONS.map((s) => s.id)
    expect(ids).toContain('overview')
    expect(ids).toContain('factures')
    expect(ids).toContain('auth')
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
    expect(scopes).toContain('factures.write')
  })
})
