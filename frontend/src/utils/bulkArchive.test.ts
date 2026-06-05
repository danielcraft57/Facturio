import { describe, expect, it, vi } from 'vitest'
import { runBulkArchive } from './bulkArchive'

describe('runBulkArchive', () => {
  it('retourne 0/0 pour une liste vide', async () => {
    await expect(runBulkArchive([], vi.fn())).resolves.toEqual({
      succeeded: 0,
      failed: 0,
      succeededIds: [],
      failedIds: [],
    })
  })

  it('compte les succès et échecs', async () => {
    const archiveOne = vi.fn(async (id: string) => {
      if (id === 'bad') throw new Error('fail')
    })
    const result = await runBulkArchive(['a', 'b', 'bad'], archiveOne)
    expect(result).toEqual({
      succeeded: 2,
      failed: 1,
      succeededIds: ['a', 'b'],
      failedIds: ['bad'],
    })
    expect(archiveOne).toHaveBeenCalledTimes(3)
  })
})
