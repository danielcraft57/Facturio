import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eInvoicingService } from './eInvoicing'
import { apiClient } from './api'

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api')
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      get: vi.fn(),
    },
  }
})

describe('eInvoicingService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('récupère la préparation organisation', async () => {
    const payload = {
      ready: false,
      score: 60,
      checks: [],
      planAllowsEInvoicing: true,
      paConnected: false,
      message: 'Complétez votre profil',
    }
    ;(apiClient.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      data: { data: payload },
    })

    const result = await eInvoicingService.getOrganizationReadiness()
    expect(apiClient.get).toHaveBeenCalledWith('e-invoicing/readiness')
    expect(result.planAllowsEInvoicing).toBe(true)
    expect(result.score).toBe(60)
  })

  it('télécharge Factur-X et déclenche le lien', async () => {
    const blob = new Blob(['<xml/>'], { type: 'application/xml' })
    const click = vi.fn()
    const createElement = vi.spyOn(document, 'createElement').mockReturnValue({
      click,
      href: '',
      download: '',
    } as unknown as HTMLAnchorElement)
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(blob),
      headers: { get: () => 'attachment; filename="factur-x-FAC-001.xml"' },
    })

    await eInvoicingService.downloadFacturX(42)

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/e-invoicing/invoices/42/factur-x'),
      expect.objectContaining({ credentials: 'include' }),
    )
    expect(click).toHaveBeenCalled()

    createElement.mockRestore()
    vi.unstubAllGlobals()
  })

  it('remonte une erreur si la génération échoue', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Plan insuffisant' }),
    })

    await expect(eInvoicingService.downloadFacturX(1)).rejects.toThrow('Plan insuffisant')
  })
})
