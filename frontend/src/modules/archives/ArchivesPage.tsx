import { Navigate } from 'react-router-dom'

/** Ancienne route /archives → factures. */
export function ArchivesPage() {
  return <Navigate to="/factures/archives" replace />
}
