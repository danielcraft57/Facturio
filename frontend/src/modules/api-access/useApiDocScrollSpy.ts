import { useCallback, useEffect, useRef, useState } from 'react'

function scrollSpyOffset(): number {
  if (typeof window === 'undefined') return 100
  if (window.innerWidth >= 1200) return 100
  if (window.innerWidth >= 900) return 92
  return 132
}

function replaceDocHash(sectionId: string) {
  const nextHash = `#${sectionId}`
  if (window.location.hash === nextHash) return
  const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`
  window.history.replaceState(null, '', nextUrl)
}

function resolveActiveSection(sectionIds: readonly string[]): string {
  const offset = scrollSpyOffset()
  let current = sectionIds[0] ?? ''
  for (const id of sectionIds) {
    const el = document.getElementById(id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= offset) current = id
  }
  return current
}

export function useApiDocScrollSpy(sectionIds: readonly string[], enabled: boolean) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '')
  const clickLock = useRef(false)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) return
    const hash = window.location.hash.replace('#', '')
    const initial = hash && sectionIds.includes(hash) ? hash : sectionIds[0]
    setActiveId(initial)
    if (hash && sectionIds.includes(hash)) {
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ block: 'start' })
      })
    }
  }, [enabled, sectionIds])

  useEffect(() => {
    if (!enabled || sectionIds.length === 0) return

    let ticking = false
    const syncFromScroll = () => {
      ticking = false
      if (clickLock.current) return
      const current = resolveActiveSection(sectionIds)
      setActiveId((prev) => (prev === current ? prev : current))
      replaceDocHash(current)
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(syncFromScroll)
      }
    }

    const onResize = () => syncFromScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    syncFromScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [enabled, sectionIds])

  const scrollToSection = useCallback((id: string) => {
    clickLock.current = true
    if (clickTimer.current) clearTimeout(clickTimer.current)
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveId(id)
    replaceDocHash(id)
    clickTimer.current = setTimeout(() => {
      clickLock.current = false
    }, 700)
  }, [])

  useEffect(
    () => () => {
      if (clickTimer.current) clearTimeout(clickTimer.current)
    },
    [],
  )

  return { activeId, scrollToSection }
}
