import {
  getGoogleSignupDisabledReasons,
  getLoginSubmitDisabledReasons,
  getSignupSubmitDisabledReasons,
} from './signupDisabledReasons'

describe('getSignupSubmitDisabledReasons', () => {
  const base = {
    pending: false,
    email: 'a@b.fr',
    organizationName: 'Org',
    password: '12345678',
    confirmPassword: '12345678',
    acceptTerms: true,
    acceptPrivacy: true,
    isLoading: false,
  }

  it('retourne une liste vide si le formulaire est valide', () => {
    expect(getSignupSubmitDisabledReasons(base)).toEqual([])
  })

  it('liste les champs manquants du screenshot type', () => {
    const reasons = getSignupSubmitDisabledReasons({
      ...base,
      organizationName: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
      acceptPrivacy: false,
    })
    expect(reasons).toContain('Indiquez le nom de votre organisation')
    expect(reasons).toContain('Choisissez un mot de passe')
    expect(reasons).toContain('Acceptez les conditions générales d\'utilisation')
  })
})

describe('getGoogleSignupDisabledReasons', () => {
  it('exige les consentements', () => {
    expect(getGoogleSignupDisabledReasons({ acceptTerms: false, acceptPrivacy: false }).length).toBe(2)
  })
})

describe('getLoginSubmitDisabledReasons', () => {
  it('exige email et mot de passe', () => {
    expect(getLoginSubmitDisabledReasons({ email: '', password: '', isLoading: false })).toHaveLength(2)
  })
})
