import { Box, Skeleton, Stack } from '@mui/material'
import { DocumentFolderSidebarSkeleton } from './DocumentFolderSidebarSkeleton'
import { ClientFolderSidebarSkeleton } from './ClientFolderSidebarSkeleton'
import { DocumentFolderContentSkeleton } from './DocumentFolderContentSkeleton'
import {
  documentFolderLayoutRowSx,
  documentFolderPageMainSx,
  documentFolderToolbarFiltersSx,
  documentFolderToolbarSx,
} from '../finance/documentFolderStyles'

type DocumentFolderRouteFallbackProps = {
  resource: 'factures' | 'devis' | 'dettes' | 'clients'
}

/** Fallback Suspense (chunk JS) — même structure que la page dossiers. */
export function DocumentFolderRouteFallback({ resource }: DocumentFolderRouteFallbackProps) {
  const SidebarSkeleton =
    resource === 'clients' ? ClientFolderSidebarSkeleton : DocumentFolderSidebarSkeleton

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: { xs: 'auto', md: 'calc(100vh - 120px)' },
      }}
    >
      <Box sx={documentFolderToolbarSx}>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width={180} height={36} animation="wave" />
            <Skeleton variant="text" width="55%" height={22} sx={{ mt: 0.5 }} animation="wave" />
          </Box>
        </Stack>
        <Box sx={documentFolderToolbarFiltersSx}>
          <Skeleton variant="rounded" height={40} animation="wave" />
        </Box>
      </Box>

      <Box sx={documentFolderLayoutRowSx}>
        <SidebarSkeleton />
        <Box sx={documentFolderPageMainSx}>
          <DocumentFolderContentSkeleton rows={8} variant="table" />
        </Box>
      </Box>
    </Box>
  )
}
