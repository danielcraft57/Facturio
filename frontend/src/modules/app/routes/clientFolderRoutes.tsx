import { Navigate, useParams } from 'react-router-dom'
import { isClientFolder, isClientDetailRouteSegment } from '../../../types/clientFolders'
import { ClientsPage } from '../../clients/ClientsPage'
import { ClientDetailPage } from '../../clients/ClientDetailPage'

export function ClientsSegmentRoute() {
  const { folder } = useParams<{ folder: string }>()

  if (!folder) return <Navigate to="/clients/inbox" replace />
  if (isClientFolder(folder)) return <ClientsPage />
  if (isClientDetailRouteSegment(folder)) return <ClientDetailPage />

  return <Navigate to="/clients/inbox" replace />
}
