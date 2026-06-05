import { isDeviceVerification } from '../auth'

describe('isDeviceVerification', () => {
  it('détecte la réponse needDeviceVerification', () => {
    expect(
      isDeviceVerification({
        needDeviceVerification: true,
        message: 'Vérifiez votre email',
      }),
    ).toBe(true)
  })

  it('rejette une AuthResponse', () => {
    expect(
      isDeviceVerification({
        access_token: 'jwt',
        user: { id: '1', email: 'a@b.fr', role: 'OWNER' },
      }),
    ).toBe(false)
  })
})
