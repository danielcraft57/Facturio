import { useEffect, useRef, useState } from 'react'

type UseScrollRevealOptions = {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

/** Révèle un élément quand il entre dans le viewport (IntersectionObserver). */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>({
  threshold = 0.12,
  rootMargin = '0px 0px -40px 0px',
  triggerOnce = true,
}: UseScrollRevealOptions = {}) {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (triggerOnce) observer.disconnect()
        } else if (!triggerOnce) {
          setVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, triggerOnce])

  return { ref, visible }
}
