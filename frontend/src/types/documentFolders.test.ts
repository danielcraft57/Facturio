import { describe, expect, it } from 'vitest'
import {
  formatDocumentFolderCount,
  normalizeDocumentFolderCounts,
} from './documentFolders'

describe('documentFolders', () => {
  it('normalise les compteurs dossiers', () => {
    expect(normalizeDocumentFolderCounts({ inbox: 3, archives: 12 })).toMatchObject({
      inbox: 3,
      archives: 12,
      brouillons: 0,
    })
  })

  it('formate le plafond archives à 100+', () => {
    expect(formatDocumentFolderCount(42)).toBe('42')
    expect(formatDocumentFolderCount(100)).toBe('100')
    expect(formatDocumentFolderCount(101)).toBe('100+')
    expect(formatDocumentFolderCount(500)).toBe('100+')
  })
})
