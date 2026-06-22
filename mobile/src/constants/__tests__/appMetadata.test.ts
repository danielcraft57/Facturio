import { APP_NAME, titleForPath } from '../appMetadata'

describe('titleForPath', () => {
  it('retourne Tableau de bord pour la racine app', () => {
    expect(titleForPath('/')).toBe('Tableau de bord')
    expect(titleForPath('/(app)')).toBe('Tableau de bord')
  })

  it('retourne le titre factures', () => {
    expect(titleForPath('/factures')).toBe('Factures')
    expect(titleForPath('/(app)/factures')).toBe('Factures')
  })

  it('retourne le titre detail facture', () => {
    expect(titleForPath('/factures/abc-123')).toBe('Facture')
    expect(titleForPath('/(app)/factures/abc-123')).toBe('Facture')
  })

  it('retourne le titre devis', () => {
    expect(titleForPath('/devis')).toBe('Devis')
    expect(titleForPath('/(app)/devis/xyz')).toBe('Devis')
  })

  it('retombe sur PrestaFacture', () => {
    expect(titleForPath('/unknown-route')).toBe(APP_NAME)
  })
})
