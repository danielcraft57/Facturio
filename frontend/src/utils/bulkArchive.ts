export type BulkArchiveResult = {
  succeeded: number
  failed: number
}

export async function runBulkArchive(
  ids: string[],
  archiveOne: (id: string) => Promise<unknown>,
): Promise<BulkArchiveResult> {
  if (ids.length === 0) return { succeeded: 0, failed: 0 }
  const results = await Promise.allSettled(ids.map((id) => archiveOne(id)))
  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  return { succeeded, failed: results.length - succeeded }
}
