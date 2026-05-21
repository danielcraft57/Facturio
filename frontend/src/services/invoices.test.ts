import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoiceService, toCreateInvoiceApiBody } from './invoices'
import { apiClient } from './api'

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api')
  return {
    ...actual,
    apiClient: {
      ...actual.apiClient,
      getCached: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      client: {
        get: vi.fn(),
      },
      invalidateCache: vi.fn(),
    },
  }
})

describe('invoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('construit bien l URL pour getInvoices avec filtres', async () => {
    ;(apiClient.getCached as any).mockResolvedValue({
      success: true,
      data: {
        invoices: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    })

    await invoiceService.getInvoices({
      search: 'FAC-2025',
      status: 'paid',
      clientId: '42',
      dateFrom: '2025-01-01',
      dateTo: '2025-12-31',
      page: 2,
      limit: 50,
      sortBy: 'issueDate',
      sortOrder: 'desc',
    })

    expect(apiClient.getCached).toHaveBeenCalledWith(
      '/invoices?search=FAC-2025&status=paid&clientId=42&dateFrom=2025-01-01&dateTo=2025-12-31&page=2&limit=50&sortBy=issueDate&sortOrder=desc',
      2 * 60 * 1000,
    )
  })

  it('invalide le cache après création de facture', async () => {
    ;(apiClient.post as any).mockResolvedValue({
      success: true,
      data: { id: '1', number: 'FAC-2025-0001' },
    })

    const payload = {
      clientId: '1',
      issueDate: '2025-01-01',
      dueDate: '2025-01-15',
      items: [
        { description: 'Service', quantity: 1, unitPrice: 100, taxRate: 0.2 },
      ],
    }

    const res = await invoiceService.createInvoice(payload as any)

    expect(apiClient.post).toHaveBeenCalledWith('/invoices', toCreateInvoiceApiBody(payload))
    expect(apiClient.invalidateCache).toHaveBeenCalledWith('/invoices')
    expect(res.success).toBe(true)
  })

  it('appelle le bon endpoint pour la génération de PDF', async () => {
    const blob = new Blob(['test'], { type: 'application/pdf' })
    ;(apiClient.client.get as any).mockResolvedValue({ data: blob })

    const result = await invoiceService.generatePDF('123')

    expect(apiClient.client.get).toHaveBeenCalledWith('/invoices/123/pdf', {
      responseType: 'blob',
    })
    expect(result).toBe(blob)
  })
})


