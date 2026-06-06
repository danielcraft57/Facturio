import { useEffect, useMemo, useState } from 'react'

const DEFAULT_INTERVAL_MS = 420

/** Animation des étapes + barre de progression (AuthBootPage, catalogue, dossiers). */
export function usePreparationProgress(steps: readonly string[], active = true) {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(8)

  const stepLabel = useMemo(
    () => steps[Math.min(stepIndex, steps.length - 1)] ?? steps[0] ?? '',
    [stepIndex, steps],
  )

  useEffect(() => {
    if (!active) return

    const stepTimer = window.setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, steps.length - 1))
      setProgress((p) => Math.min(p + 18, 92))
    }, DEFAULT_INTERVAL_MS)

    return () => window.clearInterval(stepTimer)
  }, [active, steps])

  return { stepLabel, progress }
}
