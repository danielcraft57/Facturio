import { getApiBaseUrl, unwrapApi } from '../api'

describe('unwrapApi', () => {
  it('extrait data imbriquée Nest', () => {
    expect(unwrapApi({ data: { data: { id: 1 } } })).toEqual({ id: 1 })
  })

  it('retourne data directe', () => {
    expect(unwrapApi({ data: { id: 2 } })).toEqual({ id: 2 })
  })

  it('retourne la charge brute sans enveloppe', () => {
    expect(unwrapApi({ id: 3 })).toEqual({ id: 3 })
  })
})

describe('getApiBaseUrl', () => {
  const original = process.env.EXPO_PUBLIC_API_URL

  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_API_URL
    else process.env.EXPO_PUBLIC_API_URL = original
  })

  it('utilise EXPO_PUBLIC_API_URL sans slash final', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://facturio.danielcraft.fr/api/'
    expect(getApiBaseUrl()).toBe('https://facturio.danielcraft.fr/api')
  })

  it('retombe sur localhost en dev', () => {
    delete process.env.EXPO_PUBLIC_API_URL
    expect(getApiBaseUrl()).toBe('http://localhost:3000/api')
  })
})
