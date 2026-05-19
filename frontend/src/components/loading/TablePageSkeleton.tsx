import { Box, Card, CardContent, Skeleton, Stack } from '@mui/material'

type Props = {
  rows?: number
  showHeader?: boolean
}

export function TablePageSkeleton({ rows = 8, showHeader = true }: Props) {
  return (
    <Box>
      {showHeader && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Skeleton variant="text" width={220} height={40} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant="rounded" width={140} height={40} />
        </Stack>
      )}
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Skeleton variant="rounded" height={40} sx={{ flex: 1, maxWidth: 320 }} />
            <Skeleton variant="rounded" width={120} height={40} />
          </Stack>
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1 }} />
          ))}
        </CardContent>
      </Card>
    </Box>
  )
}
