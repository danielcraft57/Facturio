import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

function stripCreateFromBrowserUrl() {
  const url = new URL(window.location.href)
  if (url.searchParams.get('create') !== '1') return
  url.searchParams.delete('create')
  const search = url.searchParams.toString()
  const next = `${url.pathname}${search ? `?${search}` : ''}${url.hash}`
  window.history.replaceState(window.history.state, '', next)
}

/**
 * Ouvre la modale si `?create=1`.
 * Le paramètre est retiré de la barre d'adresse via replaceState (pas setSearchParams)
 * pour éviter un rechargement de la liste à la fermeture.
 */
export function useDocumentFolderCreateDialog() {
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const createConsumedRef = useRef(false)

  useEffect(() => {
    if (searchParams.get('create') !== '1') {
      createConsumedRef.current = false
      return
    }
    if (createConsumedRef.current) return
    createConsumedRef.current = true
    setOpen(true)
    stripCreateFromBrowserUrl()
  }, [searchParams])

  const close = useCallback(() => {
    setOpen(false)
    stripCreateFromBrowserUrl()
  }, [])

  const openDialog = useCallback(() => {
    setOpen(true)
  }, [])

  return { open, setOpen, openDialog, close }
}
