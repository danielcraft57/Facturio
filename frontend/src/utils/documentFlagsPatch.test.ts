import { describe, expect, it } from 'vitest'
import { applyDocumentFlagsPatch } from './documentFlagsPatch'

describe('applyDocumentFlagsPatch', () => {
  const base = {
    id: 'inv-1',
    number: 'FAC-001',
    starred: false,
    important: false,
    tags: [] as string[],
    seenAt: undefined as string | undefined,
  }

  it('applique starred et important', () => {
    const next = applyDocumentFlagsPatch(base, { starred: true, important: true })
    expect(next.starred).toBe(true)
    expect(next.important).toBe(true)
  })

  it('remplace les tags', () => {
    const next = applyDocumentFlagsPatch(base, { tags: ['vip', 'relance'] })
    expect(next.tags).toEqual(['vip', 'relance'])
  })

  it('marque comme lu une seule fois', () => {
    const next = applyDocumentFlagsPatch(base, { markSeen: true })
    expect(next.seenAt).toBeTruthy()
    const again = applyDocumentFlagsPatch(
      { ...next, seenAt: '2026-01-01T00:00:00.000Z' },
      { markSeen: true },
    )
    expect(again.seenAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('efface snoozedUntil avec null', () => {
    const withSnooze = { ...base, snoozedUntil: '2026-06-01T00:00:00.000Z' }
    const next = applyDocumentFlagsPatch(withSnooze, { snoozedUntil: null })
    expect(next.snoozedUntil).toBeUndefined()
  })
})
