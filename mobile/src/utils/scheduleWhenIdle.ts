/** Diffère un bootstrap lourd sur web pour limiter les blocages visibilitychange / resize. */
export function scheduleWhenIdle(run: () => void, platform: string): () => void {
  if (platform === 'web' && typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(run, { timeout: 1500 })
    return () => cancelIdleCallback(id)
  }
  run()
  return () => {}
}
