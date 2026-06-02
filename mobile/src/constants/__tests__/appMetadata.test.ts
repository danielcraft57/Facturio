import { APP_NAME, titleForPath } from '../appMetadata'

describe('titleForPath', () => {
  it('retourne Tableau de bord pour la racine app', () => {
    expect(titleForPath('/')).toBe('Tableau de bord')
    expect(titleForPath('/(app)')).toBe('Tableau de bord')
  })

  it('retourne le titre factures', () => {
    expect(titleForPath('/invoices')).toBe('Factures')
  })

  it('retombe sur Facturio', () => {
    expect(titleForPath('/unknown-route')).toBe(APP_NAME)
  })
})
