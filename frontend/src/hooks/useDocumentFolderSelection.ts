import { useCallback, useEffect, useMemo, useState } from 'react'

export function useDocumentFolderSelection<T extends { id: string }>(
  visibleItems: T[],
  resetKey: string,
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setSelectedIds(new Set())
  }, [resetKey])

  const selectionActive = selectedIds.size > 0

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clear = useCallback(() => setSelectedIds(new Set()), [])

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(visibleItems.map((item) => item.id)))
  }, [visibleItems])

  const allVisibleSelected = useMemo(
    () => visibleItems.length > 0 && visibleItems.every((item) => selectedIds.has(item.id)),
    [visibleItems, selectedIds],
  )

  const someVisibleSelected = useMemo(
    () => visibleItems.some((item) => selectedIds.has(item.id)) && !allVisibleSelected,
    [visibleItems, selectedIds, allVisibleSelected],
  )

  const selectedOnPageCount = useMemo(
    () => visibleItems.filter((item) => selectedIds.has(item.id)).length,
    [visibleItems, selectedIds],
  )

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    selectionActive,
    selectedOnPageCount,
    isSelected,
    toggle,
    clear,
    selectAllVisible,
    allVisibleSelected,
    someVisibleSelected,
  }
}
