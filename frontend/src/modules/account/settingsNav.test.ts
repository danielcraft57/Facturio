import { filterSettingsNavItems, settingsNavItems } from './settingsNav'

describe('filterSettingsNavItems', () => {
  const quotasItem = settingsNavItems.find((i) => i.to === '/parametres/quotas')
  const tokensItem = settingsNavItems.find((i) => i.to === '/parametres/tokens')

  it('masque l’API Pro sans accès publicApi', () => {
    const items = filterSettingsNavItems(settingsNavItems, { publicApiEnabled: false, isFreePlan: true })
    expect(items.some((i) => i.to === '/parametres/tokens')).toBe(false)
    expect(items.some((i) => i.to === '/parametres/quotas')).toBe(true)
  })

  it('affiche l’API Pro sur plan payant', () => {
    const items = filterSettingsNavItems(settingsNavItems, { publicApiEnabled: true, isFreePlan: false })
    expect(items.some((i) => i.to === tokensItem?.to)).toBe(true)
    expect(items.some((i) => i.to === quotasItem?.to)).toBe(false)
  })

  it('masque les quotas hors plan Free', () => {
    const items = filterSettingsNavItems(settingsNavItems, { isFreePlan: false })
    expect(items.some((i) => i.requiresFree)).toBe(false)
  })
})
