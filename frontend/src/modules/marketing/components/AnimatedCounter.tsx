import { useEffect, useState } from 'react'
import { Typography, type TypographyProps } from '@mui/material'
import { useScrollReveal } from '../hooks/useScrollReveal'

type AnimatedCounterProps = TypographyProps & {
  value: number
  suffix?: string
  prefix?: string
  durationMs?: number
}

/** Compte progressivement jusqu'à `value` lorsque visible à l'écran. */
export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  durationMs = 1400,
  ...typographyProps
}: AnimatedCounterProps) {
  const { ref, visible } = useScrollReveal<HTMLSpanElement>()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!visible) return
    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [visible, value, durationMs])

  return (
    <Typography component="span" ref={ref} {...typographyProps}>
      {prefix}
      {display}
      {suffix}
    </Typography>
  )
}
