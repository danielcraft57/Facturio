import { resolveResponsiveLayout } from '../responsiveLayout'

describe('resolveResponsiveLayout', () => {
  it('utilise la barre du bas en portrait téléphone', () => {
    expect(resolveResponsiveLayout(390, 844)).toEqual({
      isLandscape: false,
      isTablet: false,
      useSidebarLayout: false,
    })
  })

  it('active la sidebar en paysage dès 560 px de large', () => {
    expect(resolveResponsiveLayout(667, 375).useSidebarLayout).toBe(true)
    expect(resolveResponsiveLayout(559, 320).useSidebarLayout).toBe(false)
  })

  it('active la sidebar sur tablette en portrait', () => {
    expect(resolveResponsiveLayout(768, 1024).useSidebarLayout).toBe(true)
  })
})
