export type BulkArchiveResult = {
  succeeded: number
  failed: number
  succeededIds: string[]
  failedIds: string[]
}

export async function runBulkArchive(
  ids: string[],
  archiveOne: (id: string) => Promise<unknown>,
): Promise<BulkArchiveResult> {
  if (ids.length === 0) {
    return { succeeded: 0, failed: 0, succeededIds: [], failedIds: [] }
  }
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      await archiveOne(id)
      return id
    }),
  )
  const succeededIds: string[] = []
  const failedIds: string[] = []
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'fulfilled') succeededIds.push(ids[i])
    else failedIds.push(ids[i])
  }
  return {
    succeeded: succeededIds.length,
    failed: failedIds.length,
    succeededIds,
    failedIds,
  }
}
