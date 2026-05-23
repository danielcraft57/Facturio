import { Box, List, Skeleton, Stack } from '@mui/material'
import { CLIENT_FOLDERS } from '../../types/clientFolders'
import { documentFolderSidebarSx } from '../finance/documentFolderStyles'

export function ClientFolderSidebarSkeleton() {
  return (
    <Box sx={documentFolderSidebarSx}>
      <Box sx={{ p: 1.5, pb: 1 }}>
        <Skeleton variant="rounded" height={40} sx={{ borderRadius: 2.5 }} />
      </Box>
      <List dense sx={{ flex: 1, px: 0.75, py: 0.5 }}>
        {CLIENT_FOLDERS.map((folder) => (
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
    </Box>
  )
}
