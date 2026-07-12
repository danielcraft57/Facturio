import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const PENDING_CREATE_KEY = 'facturio_pending_create_dialog'

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
 * Un flag sessionStorage évite la perte d'ouverture en dev (React Strict Mode).
 */
export function useDocumentFolderCreateDialog() {
  const [searchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const createConsumedRef = useRef(false)

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      sessionStorage.setItem(PENDING_CREATE_KEY, '1')
    }
  }, [searchParams])

  useEffect(() => {
    const fromUrl = searchParams.get('create') === '1'
    const fromPending = sessionStorage.getItem(PENDING_CREATE_KEY) === '1'
    if (!fromUrl && !fromPending) {
      createConsumedRef.current = false
      return
    }
    if (createConsumedRef.current) return
    createConsumedRef.current = true
    sessionStorage.removeItem(PENDING_CREATE_KEY)
    setOpen(true)
    if (fromUrl) stripCreateFromBrowserUrl()
  }, [searchParams])

  const close = useCallback(() => {
    setOpen(false)
    sessionStorage.removeItem(PENDING_CREATE_KEY)
    stripCreateFromBrowserUrl()
  }, [])

  const openDialog = useCallback(() => {
    setOpen(true)
  }, [])

  return { open, setOpen, openDialog, close }
}
