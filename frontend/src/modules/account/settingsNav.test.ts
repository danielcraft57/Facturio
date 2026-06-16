import { filterSettingsNavItems, groupSettingsNavItems, settingsNavItems } from './settingsNav'

describe('filterSettingsNavItems', () => {
  const quotasItem = settingsNavItems.find((i) => i.to === '/parametres/quotas')
  const tokensItem = settingsNavItems.find((i) => i.to === '/parametres/tokens')

  it('affiche l’API Pro verrouillée sans accès publicApi', () => {
    const items = filterSettingsNavItems(settingsNavItems, { publicApiEnabled: false, isFreePlan: true })
    const tokens = items.find((i) => i.to === tokensItem?.to)
    expect(tokens).toBeDefined()
    expect(tokens?.planLocked).toBe(true)
    expect(items.some((i) => i.to === '/parametres/quotas')).toBe(true)
  })

  it('déverrouille l’API Pro sur plan payant', () => {
    const items = filterSettingsNavItems(settingsNavItems, { publicApiEnabled: true, isFreePlan: false })
    const tokens = items.find((i) => i.to === tokensItem?.to)
    expect(tokens?.planLocked).toBe(false)
    expect(items.some((i) => i.to === quotasItem?.to)).toBe(false)
  })

  it('masque les quotas hors plan Free', () => {
    const items = filterSettingsNavItems(settingsNavItems, { isFreePlan: false })
    expect(items.some((i) => i.requiresFree)).toBe(false)
  })
})

describe('groupSettingsNavItems', () => {
  it('regroupe par section avec API Pro en dernier', () => {
    const items = filterSettingsNavItems(settingsNavItems, { publicApiEnabled: false, isFreePlan: true })
    const groups = groupSettingsNavItems(items)
    const labels = groups.map((g) => g.label)
    expect(labels).toContain('API Pro')
    expect(labels.indexOf('API Pro')).toBeGreaterThan(labels.indexOf('Compte'))
  })
})
