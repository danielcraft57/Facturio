import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { isDocumentFolder } from '../../../types/documentFolders'
import { isEntityId } from '../../../utils/entityId'
import { InvoicesPage } from '../../invoices/InvoicesPage'
import { QuotesPage } from '../../quotes/QuotesPage'

/** Redirection création depuis /factures/new ou /devis/new */
function NewDocumentRedirect({ resource }: { resource: 'factures' | 'devis' }) {
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')
  const qs = new URLSearchParams({ create: '1' })
  if (clientId) qs.set('clientId', clientId)
  return <Navigate to={`/${resource}/inbox?${qs.toString()}`} replace />
}

export function FacturesSegmentRoute() {
  const { folder } = useParams<{ folder: string }>()

  if (!folder) return <Navigate to="/factures/inbox" replace />
  if (folder === 'new') return <NewDocumentRedirect resource="factures" />
  if (folder === 'archive') return <Navigate to="/factures/archives" replace />
  if (isDocumentFolder(folder)) return <InvoicesPage />

  if (isEntityId(folder)) {
    return <Navigate to={`/factures/voir/${folder}`} replace />
  }

  return <Navigate to="/factures/inbox" replace />
}

export function DevisSegmentRoute() {
  const { folder } = useParams<{ folder: string }>()

  if (!folder) return <Navigate to="/devis/inbox" replace />
  if (folder === 'new') return <NewDocumentRedirect resource="devis" />
  if (folder === 'archive') return <Navigate to="/devis/archives" replace />
  if (isDocumentFolder(folder)) return <QuotesPage />

  if (isEntityId(folder)) {
    return <Navigate to={`/devis/voir/${folder}`} replace />
  }

  return <Navigate to="/devis/inbox" replace />
}
