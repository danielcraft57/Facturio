import { payablesService } from '../payablesService'
import { apiClient } from '../apiClient'

jest.mock('../apiClient', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}))

const mockGet = apiClient.get as jest.Mock
const mockPost = apiClient.post as jest.Mock

describe('payablesService', () => {
  beforeEach(() => jest.clearAllMocks())

  it('appelle GET /payables pour le résumé', async () => {
    mockGet.mockResolvedValue({ summary: { totalOutstanding: 100 }, debts: [] })
    await payablesService.getSummary()
    expect(mockGet).toHaveBeenCalledWith('/payables')
  })

  it('liste les dettes inbox', async () => {
    mockGet.mockResolvedValue({ debts: [], total: 0, page: 1, pageSize: 15 })
    await payablesService.listDebts({ folder: 'inbox', page: 1, limit: 15 })
    expect(mockGet).toHaveBeenCalledWith('/payables/debts', {
      folder: 'inbox',
      page: 1,
      limit: 15,
    })
  })

  it('enregistre un paiement', async () => {
    mockPost.mockResolvedValue({ id: 1, balance: 0 })
    await payablesService.recordPayment(3, { amount: 50 })
    expect(mockPost).toHaveBeenCalledWith('/payables/debts/3/payments', { amount: 50 })
  })
})
