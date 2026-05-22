import { Box, Divider, List, Skeleton, Stack } from '@mui/material'
import { DOCUMENT_FOLDERS } from '../../types/documentFolders'
import { documentFolderSidebarSx } from '../finance/documentFolderStyles'

/** Squelette de la barre latérale dossiers (compteurs + libellés). */
export function DocumentFolderSidebarSkeleton() {
  return (
    <Box sx={documentFolderSidebarSx}>
      <Box sx={{ p: 1.5, pb: 1 }}>
        <Skeleton variant="rounded" height={40} sx={{ borderRadius: 2.5 }} />
      </Box>
      <List dense sx={{ flex: 1, px: 0.75, py: 0.5 }}>
        {DOCUMENT_FOLDERS.map((folder) => (
          <Stack
            key={folder}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ py: 0.85, px: 1 }}
          >
            <Skeleton variant="circular" width={22} height={22} />
            <Skeleton variant="text" sx={{ flex: 1 }} height={18} />
            <Skeleton variant="rounded" width={22} height={18} />
          </Stack>
        ))}
      </List>
      <Divider sx={{ mx: 1 }} />
      <Box sx={{ px: 1.75, py: 1.25 }}>
        <Skeleton variant="text" width="55%" height={18} />
      </Box>
    </Box>
  )
}
