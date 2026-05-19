import { useEffect, useRef } from 'react'

/**
 * Exécute un effet après un délai sans re-déclencher à chaque render intermédiaire.
 */
export function useDebouncedEffect(
  effect: () => void | (() => void),
  deps: React.DependencyList,
  delayMs: number,
): void {
  const effectRef = useRef(effect)
  effectRef.current = effect

  useEffect(() => {
    const handle = window.setTimeout(() => {
      return effectRef.current()
    }, delayMs)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce sur deps explicites
  }, [...deps, delayMs])
}
