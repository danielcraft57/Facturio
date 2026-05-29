import { useCallback, type Dispatch, type SetStateAction } from 'react'
import type { DocumentFlags } from '../types/documentFolders'
import { applyDocumentFlagsPatch } from '../utils/documentFlagsPatch'

type Identifiable = { id: string }

export function useOptimisticDocumentFlagsPatch<T extends Identifiable>(
  setItems: Dispatch<SetStateAction<T[]>>,
  updateApi: (id: string, patch: DocumentFlags) => Promise<unknown>,
  onError: (message: string) => void,
) {
  return useCallback(
    async (id: string, patch: DocumentFlags) => {
      let previous: T | undefined

      setItems((curr) => {
        const item = curr.find((i) => i.id === id)
        if (!item) return curr
        previous = item
        return curr.map((i) => (i.id === id ? applyDocumentFlagsPatch(i, patch) : i))
      })

      if (!previous) return

      try {
        await updateApi(id, patch)
      } catch (err) {
        const rollback = previous
        setItems((curr) => curr.map((i) => (i.id === id ? rollback : i)))
        onError(err instanceof Error ? err.message : 'Mise à jour impossible')
      }
    },
    [setItems, updateApi, onError],
  )
}
