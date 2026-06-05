import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SxProps, Theme } from '@mui/material/styles'
import {
  DOCUMENT_FOLDER_RAIL_ENTER_MS,
  DOCUMENT_FOLDER_RAIL_EXIT_MS,
  getDocumentFolderRowMotionClipSx,
  getDocumentFolderRowMotionSx,
  sleep,
  type DocumentFolderRowMotion,
  type DocumentFolderRowMotionLayout,
} from '../components/finance/documentFolderRailMotion'
import type { BulkArchiveResult } from '../utils/bulkArchive'

export function useDocumentFolderRowMotion() {
  const [motions, setMotions] = useState<Record<string, DocumentFolderRowMotion>>({})

  const markExit = useCallback((ids: Iterable<string>) => {
    const list = [...ids]
    if (!list.length) return
    setMotions((prev) => {
      const next = { ...prev }
      for (const id of list) next[id] = 'exit'
      return next
    })
  }, [])

  const markEnter = useCallback((ids: Iterable<string>) => {
    const list = [...ids]
    if (!list.length) return
    setMotions((prev) => {
      const next = { ...prev }
      for (const id of list) next[id] = 'enter'
      return next
    })
  }, [])

  const clearMotions = useCallback((ids: Iterable<string>) => {
    const list = [...ids]
    if (!list.length) return
    setMotions((prev) => {
      const next = { ...prev }
      for (const id of list) delete next[id]
      return next
    })
  }, [])

  const hasRowMotion = useMemo(() => Object.keys(motions).length > 0, [motions])

  const getMotionSx = useCallback(
    (id: string, layout: DocumentFolderRowMotionLayout = 'table'): SxProps<Theme> =>
      getDocumentFolderRowMotionSx(motions[id], layout),
    [motions],
  )

  const getMotionClipSx = useCallback(
    (): SxProps<Theme> => getDocumentFolderRowMotionClipSx(hasRowMotion),
    [hasRowMotion],
  )

  const runArchiveWithRailExit = useCallback(
    async (
      ids: string[],
      archiveFn: () => Promise<BulkArchiveResult>,
    ): Promise<BulkArchiveResult> => {
      if (!ids.length) {
        return { succeeded: 0, failed: 0, succeededIds: [], failedIds: [] }
      }
      markExit(ids)
      const [result] = await Promise.all([archiveFn(), sleep(DOCUMENT_FOLDER_RAIL_EXIT_MS)])
      clearMotions(ids)
      return result
    },
    [markExit, clearMotions],
  )

  return {
    motions,
    markExit,
    markEnter,
    clearMotions,
    hasRowMotion,
    getMotionSx,
    getMotionClipSx,
    runArchiveWithRailExit,
  }
}

/** Détecte les nouvelles lignes après refresh et anime l’entrée du rail. */
export function useDocumentFolderNewRowMotion(
  rowIds: string[],
  motion: Pick<ReturnType<typeof useDocumentFolderRowMotion>, 'markEnter' | 'clearMotions'>,
) {
  const prevRef = useRef<Set<string>>(new Set())
  const { markEnter, clearMotions } = motion

  useEffect(() => {
    const current = new Set(rowIds.map(String))
    if (prevRef.current.size === 0) {
      prevRef.current = current
      return
    }
    const added = [...current].filter((id) => !prevRef.current.has(id))
    prevRef.current = current
    if (!added.length) return

    markEnter(added)
    const timer = window.setTimeout(
      () => clearMotions(added),
      DOCUMENT_FOLDER_RAIL_ENTER_MS + 40,
    )
    return () => window.clearTimeout(timer)
  }, [rowIds, markEnter, clearMotions])
}
