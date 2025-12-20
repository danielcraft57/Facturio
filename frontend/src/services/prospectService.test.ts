import { describe, it, expect, beforeEach } from 'vitest'
import { prospectService } from './prospectService'
import { ProspectStatus, CompanySize } from '../types/prospect'

describe('prospectService (mock en mémoire)', () => {
  beforeEach(async () => {
    // Pas de reset global simple, on s appuie sur le fait que les tests restent légers
  })

  it('filtre les prospects par statut et secteur', async () => {
    const res = await prospectService.getProspects(
      {
        status: [ProspectStatus.QUALIFIED],
        industry: ['SaaS'],
      },
      1,
      10,
    )

    expect(res.total).toBeGreaterThan(0)
    expect(
      res.data.every(
        (p) =>
          p.status === ProspectStatus.QUALIFIED && p.industry === 'SaaS',
      ),
    ).toBe(true)
  })

  it('crée puis met à jour un prospect', async () => {
    const created = await prospectService.createProspect({
      companyName: 'NewCo',
      industry: 'Agency',
      size: CompanySize.STARTUP,
      email: 'contact@newco.test',
      source: 'Direct',
    } as any)

    expect(created.id).toBeDefined()
    expect(created.companyName).toBe('NewCo')

    const updated = await prospectService.updateProspect(created.id, {
      companyName: 'NewCo Updated',
    } as any)

    expect(updated.companyName).toBe('NewCo Updated')
  })
})


