import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material'

type SettingsPageSkeletonProps = {
  blocks?: number
}

export function SettingsPageSkeleton({ blocks = 2 }: SettingsPageSkeletonProps) {
  return (
    <Box>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="70%" height={20} sx={{ mb: 3 }} />
      <Stack spacing={2}>
        {Array.from({ length: blocks }).map((_, i) => (
          <Card key={i} variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Skeleton variant="text" width="30%" height={28} sx={{ mb: 2 }} />
              <Skeleton variant="rounded" height={48} sx={{ mb: 1.5 }} />
              <Skeleton variant="rounded" height={48} sx={{ mb: 1.5 }} />
              <Skeleton variant="rounded" height={48} width="60%" />
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
