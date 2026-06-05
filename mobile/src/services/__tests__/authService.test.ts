import { authService } from '../authService'
import { apiClient } from '../apiClient'
import * as sessionStorage from '../sessionStorage'

jest.mock('../apiClient', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
    setUnauthorizedHandler: jest.fn(),
  },
}))

jest.mock('../sessionStorage', () => ({
  getDeviceFingerprint: jest.fn().mockResolvedValue('mobile-test-fp'),
  setAuthSession: jest.fn(),
  clearAuthSession: jest.fn(),
  getAuthToken: jest.fn(),
  getStoredUserJson: jest.fn(),
}))

const mockPost = apiClient.post as jest.Mock
const mockGet = apiClient.get as jest.Mock

describe('authService.login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('persiste le token après connexion réussie', async () => {
    mockPost.mockResolvedValue({
      access_token: 'token-abc',
      user: { id: '1', email: 'u@test.fr', role: 'OWNER' },
    })

    const result = await authService.login('u@test.fr', 'secret')

    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'u@test.fr',
      password: 'secret',
      deviceFingerprint: 'mobile-test-fp',
    })
    expect(sessionStorage.setAuthSession).toHaveBeenCalledWith(
      'token-abc',
      expect.stringContaining('u@test.fr'),
    )
    expect(result).toMatchObject({ access_token: 'token-abc' })
  })

  it('ne persiste pas si vérification appareil requise', async () => {
    mockPost.mockResolvedValue({
      needDeviceVerification: true,
      message: 'Email envoyé',
    })

    const result = await authService.login('u@test.fr', 'secret')

    expect(sessionStorage.setAuthSession).not.toHaveBeenCalled()
    expect(result).toEqual({ needDeviceVerification: true, message: 'Email envoyé' })
  })
})

describe('authService.restoreSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retourne null sans token local', async () => {
    ;(sessionStorage.getAuthToken as jest.Mock).mockResolvedValue(null)
    ;(sessionStorage.getStoredUserJson as jest.Mock).mockResolvedValue(null)

    await expect(authService.restoreSession()).resolves.toBeNull()
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('rafraîchit le profil via /auth/me', async () => {
    ;(sessionStorage.getAuthToken as jest.Mock).mockResolvedValue('tok')
    ;(sessionStorage.getStoredUserJson as jest.Mock).mockResolvedValue('{}')
    mockGet.mockResolvedValue({ id: '1', email: 'u@test.fr', role: 'OWNER' })

    const user = await authService.restoreSession()

    expect(mockGet).toHaveBeenCalledWith('/auth/me')
    expect(user?.email).toBe('u@test.fr')
  })
})
