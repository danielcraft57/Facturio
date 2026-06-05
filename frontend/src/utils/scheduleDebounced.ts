/** Regroupe les rafraîchissements temps réel (rafales SSE). */
export function scheduleDebounced(fn: () => void, delayMs = 350): void {
  const key = '__facturioDebounceTimers'
  const bag = (globalThis as Record<string, Map<() => void, ReturnType<typeof setTimeout>>>)[key] ??=
    new Map()
  const prev = bag.get(fn)
  if (prev) clearTimeout(prev)
  bag.set(
    fn,
    setTimeout(() => {
      bag.delete(fn)
      fn()
    }, delayMs),
  )
}
