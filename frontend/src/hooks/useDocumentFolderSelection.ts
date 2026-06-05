import { useCallback, useEffect, useMemo, useState } from 'react'

function itemIdKey(id: string | number): string {
  return String(id)
}

export function useDocumentFolderSelection<T extends { id: string | number }>(
  visibleItems: T[],
  resetKey: string,
) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setSelectedIds(new Set())
  }, [resetKey])

  const selectionActive = selectedIds.size > 0

  const isSelected = useCallback(
    (id: string | number) => selectedIds.has(itemIdKey(id)),
    [selectedIds],
  )

  const toggle = useCallback((id: string | number) => {
    const key = itemIdKey(id)
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const clear = useCallback(() => setSelectedIds(new Set()), [])

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(visibleItems.map((item) => itemIdKey(item.id))))
  }, [visibleItems])

  const allVisibleSelected = useMemo(
    () =>
      visibleItems.length > 0 &&
      visibleItems.every((item) => selectedIds.has(itemIdKey(item.id))),
    [visibleItems, selectedIds],
  )

  const someVisibleSelected = useMemo(
    () =>
      visibleItems.some((item) => selectedIds.has(itemIdKey(item.id))) &&
      !allVisibleSelected,
    [visibleItems, selectedIds, allVisibleSelected],
  )

  const selectedOnPageCount = useMemo(
    () => visibleItems.filter((item) => selectedIds.has(itemIdKey(item.id))).length,
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
