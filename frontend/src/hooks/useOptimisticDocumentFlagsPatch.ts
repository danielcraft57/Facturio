import { useCallback, type Dispatch, type SetStateAction } from 'react'
import type { DocumentFlags } from '../types/documentFolders'
import { applyDocumentFlagsPatch } from '../utils/documentFlagsPatch'

type Identifiable = { id: string | number }

export function useOptimisticDocumentFlagsPatch<T extends Identifiable>(
  setItems: Dispatch<SetStateAction<T[]>>,
  updateApi: (id: string | number, patch: DocumentFlags) => Promise<unknown>,
  onError: (message: string) => void,
) {
  return useCallback(
    async (id: string | number, patch: DocumentFlags) => {
      let previous: T | undefined
      const key = String(id)

      setItems((curr) => {
        const item = curr.find((i) => String(i.id) === key)
        if (!item) return curr
        previous = item
        return curr.map((i) => (String(i.id) === key ? applyDocumentFlagsPatch(i, patch) : i))
      })

      if (!previous) return

      try {
        await updateApi(id, patch)
      } catch (err) {
        const rollback = previous
        setItems((curr) => curr.map((i) => (String(i.id) === key ? rollback : i)))
        onError(err instanceof Error ? err.message : 'Mise à jour impossible')
      }
    },
    [setItems, updateApi, onError],
  )
}
