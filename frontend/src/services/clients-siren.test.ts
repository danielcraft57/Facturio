import { describe, it, expect } from 'vitest'
import { mapApiClientToClient, toCreateClientPayload } from './clients'

describe('clients SIREN (réforme 2026)', () => {
  it('mapApiClientToClient expose le SIREN API', () => {
    const client = mapApiClientToClient({
      id: 1,
      name: 'ACME',
      email: 'a@acme.fr',
      siren: '123456789',
      companyName: 'ACME',
    })
    expect(client.siren).toBe('123456789')
  })

  it('toCreateClientPayload n’envoie un SIREN que s’il fait 9 chiffres', () => {
    expect(toCreateClientPayload({
      name: 'ACME',
      email: 'a@acme.fr',
      siren: '123 456 789',
      isCompany: true,
    })).toMatchObject({ siren: '123456789' })

    expect(toCreateClientPayload({
      name: 'ACME',
      email: 'a@acme.fr',
      siren: '12345',
      isCompany: true,
    })).not.toHaveProperty('siren')
  })
})
