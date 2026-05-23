import { Navigate, useParams } from 'react-router-dom'
import { isClientFolder } from '../../../types/clientFolders'
import { ClientsPage } from '../../clients/ClientsPage'
import { ClientDetailPage } from '../../clients/ClientDetailPage'

export function ClientsSegmentRoute() {
  const { folder } = useParams<{ folder: string }>()

  if (!folder) return <Navigate to="/clients/inbox" replace />
  if (/^\d+$/.test(folder)) return <ClientDetailPage />
  if (isClientFolder(folder)) return <ClientsPage />

  return <Navigate to="/clients/inbox" replace />
}
