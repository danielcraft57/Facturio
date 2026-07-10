import { describe, expect, it } from 'vitest'
import type { EditableLine } from './EditableProductLinesTable'
import {
  applyProductLineFieldChange,
  ensureTrailingEmptyLine,
  filterProductLinesForSubmit,
  isProductLineEmpty,
  removeProductLine,
  normalizeProductLineQuantity,
  calculateProductLinesTotals,
} from './editableProductLinesUtils'

const empty = () => ({
  description: '',
  quantity: 1,
  unitPrice: 0,
  taxRate: 20,
})

describe('editableProductLinesUtils', () => {
  it('détecte une ligne vide', () => {
    expect(isProductLineEmpty(empty())).toBe(true)
    expect(isProductLineEmpty({ ...empty(), description: 'Presta' })).toBe(false)
  })

  it('filtre les lignes vides à la soumission', () => {
    const lines = [
      { ...empty(), description: 'A', unitPrice: 100 },
      empty(),
    ]
    expect(filterProductLinesForSubmit(lines)).toHaveLength(1)
  })

  it('ajoute une ligne vide en fin si la dernière est remplie', () => {
    const lines = [{ ...empty(), description: 'A', unitPrice: 50 }]
    const next = ensureTrailingEmptyLine(lines, empty)
    expect(next).toHaveLength(2)
    expect(isProductLineEmpty(next[1])).toBe(true)
  })

  it('met à jour un champ et conserve productId', () => {
    const lines: EditableLine[] = [{ ...empty(), description: 'X', productId: 7, unitPrice: 10 }]
    const next = applyProductLineFieldChange(
      lines,
      0,
      (line) => ({ ...line, description: 'Y', productId: undefined }),
      empty,
    )
    expect(next[0].description).toBe('Y')
    expect((next[0] as EditableLine).productId).toBeUndefined()
  })

  it('supprime une ligne intermédiaire', () => {
    const lines = [
      { ...empty(), description: 'A', unitPrice: 10 },
      { ...empty(), description: 'B', unitPrice: 20 },
      empty(),
    ]
    const next = removeProductLine(lines, 1, empty)
    expect(filterProductLinesForSubmit(next).map((l) => l.description)).toEqual(['A'])
  })

  it('normalise la quantité (min 1, entier)', () => {
    expect(normalizeProductLineQuantity(0)).toBe(1)
    expect(normalizeProductLineQuantity(2.7)).toBe(3)
    expect(normalizeProductLineQuantity('4')).toBe(4)
  })

  it('calcule les totaux avec quantité', () => {
    const lines = [
      { ...empty(), description: 'Dev', quantity: 2, unitPrice: 100, taxRate: 20 },
    ]
    expect(calculateProductLinesTotals(lines)).toEqual({
      subtotal: 200,
      taxTotal: 40,
      total: 240,
    })
  })
})
