import { receivablesService } from '../receivablesService'
import { apiClient } from '../apiClient'

jest.mock('../apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

const mockGet = apiClient.get as jest.Mock
const mockPost = apiClient.post as jest.Mock

describe('receivablesService', () => {
  beforeEach(() => jest.clearAllMocks())

  it('appelle GET /receivables', async () => {
    mockGet.mockResolvedValue({ summary: { totalOutstanding: 0 }, invoices: [], clients: [] })
    await receivablesService.getReceivables()
    expect(mockGet).toHaveBeenCalledWith('/receivables', undefined)
  })

  it('passe le filtre kind', async () => {
    mockGet.mockResolvedValue({ summary: {}, invoices: [], clients: [] })
    await receivablesService.getReceivables({ kind: 'deposit' })
    expect(mockGet).toHaveBeenCalledWith('/receivables', { kind: 'deposit' })
  })

  it('relance les factures en retard', async () => {
    mockPost.mockResolvedValue({ sent: 1, skipped: 0, errors: [] })
    const result = await receivablesService.remindOverdue(['inv-1'])
    expect(mockPost).toHaveBeenCalledWith('/receivables/remind-overdue', { invoiceIds: ['inv-1'] })
    expect(result.sent).toBe(1)
  })
})
