import { Box, Card, CardContent, Container, Skeleton, Stack } from '@mui/material'

export function InvoicePublicSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Skeleton variant="text" width="60%" height={48} />
        <Skeleton variant="text" width="40%" height={28} />
        <Card variant="outlined">
          <CardContent>
            {Array.from({ length: 4 }).map((_, i) => (
              <Stack key={i} direction="row" spacing={2} sx={{ mb: 1.5 }}>
                <Skeleton variant="text" sx={{ flex: 2 }} height={32} />
                <Skeleton variant="text" width={60} height={32} />
                <Skeleton variant="text" width={80} height={32} />
                <Skeleton variant="text" width={80} height={32} />
              </Stack>
            ))}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Skeleton variant="text" width={160} height={40} />
            </Box>
          </CardContent>
        </Card>
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rounded" width={160} height={44} />
          <Skeleton variant="rounded" width={180} height={44} />
        </Stack>
      </Stack>
    </Container>
  )
}
