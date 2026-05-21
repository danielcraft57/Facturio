import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiClient } from './apiClient'
import { ProspectStatus, CompanySize } from '../types/prospect'

const mockClient = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}

vi.mock('./apiClient', () => ({
  ApiClient: {
    getInstance: () => mockClient,
    resetInstanceForTests: vi.fn(),
  },
}))

describe('prospectService', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    ApiClient.resetInstanceForTests()
    vi.resetModules()
  })

  it('filtre les prospects par statut et secteur', async () => {
    mockClient.get.mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: '1',
            companyName: 'Acme',
            status: ProspectStatus.QUALIFIED,
            industry: 'SaaS',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      },
    })
    const { prospectService } = await import('./prospectService')

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
        (p) => p.status === ProspectStatus.QUALIFIED && p.industry === 'SaaS',
      ),
    ).toBe(true)
  })

  it('crée puis met à jour un prospect', async () => {
    mockClient.post.mockResolvedValue({
      success: true,
      data: { id: 'p1', companyName: 'NewCo' },
    })
    mockClient.patch.mockResolvedValue({
      success: true,
      data: { id: 'p1', companyName: 'NewCo Updated' },
    })
    const { prospectService } = await import('./prospectService')

    const created = await prospectService.createProspect({
      companyName: 'NewCo',
      industry: 'Agency',
      size: CompanySize.STARTUP,
      email: 'contact@newco.test',
      source: 'Direct',
    } as never)

    expect(created.id).toBeDefined()
    expect(created.companyName).toBe('NewCo')

    const updated = await prospectService.updateProspect(created.id, {
      companyName: 'NewCo Updated',
    } as never)

    expect(updated.companyName).toBe('NewCo Updated')
  })
})
