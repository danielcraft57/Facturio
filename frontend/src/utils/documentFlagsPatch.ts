import type { DocumentFlags } from '../types/documentFolders'

/** Applique un patch de flags document sur un item liste (facture, devis…). */
export function applyDocumentFlagsPatch<T extends Record<string, unknown>>(
  item: T,
  patch: DocumentFlags,
): T {
  const next = { ...item } as T & DocumentFlags
  if (patch.starred !== undefined) next.starred = patch.starred
  if (patch.important !== undefined) next.important = patch.important
  if (patch.snoozedUntil !== undefined) {
    next.snoozedUntil = patch.snoozedUntil ?? undefined
  }
  if (patch.tags !== undefined) next.tags = patch.tags
  if (patch.markSeen && !(next as { seenAt?: string }).seenAt) {
    ;(next as { seenAt?: string }).seenAt = new Date().toISOString()
  }
  return next as T
}
