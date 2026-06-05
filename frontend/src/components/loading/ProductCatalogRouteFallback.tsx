import { Box, Grid, Skeleton, Stack } from '@mui/material'
import { financePagePadding } from '../finance/financeStyles'

/** Fallback Suspense (chunk JS) — squelette seul, sans popin (évite le doublon avec ProductsPage). */
export function ProductCatalogRouteFallback() {
  return (
    <Box sx={{ p: financePagePadding }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={240} height={40} animation="wave" />
          <Skeleton variant="text" width="72%" height={24} sx={{ mt: 0.75 }} animation="wave" />
        </Box>
        <Skeleton variant="rounded" width={160} height={40} animation="wave" />
      </Stack>

      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
        <Skeleton variant="rounded" width={280} height={36} animation="wave" />
        <Skeleton variant="rounded" sx={{ flex: 1, height: 48 }} animation="wave" />
        <Skeleton variant="rounded" width={36} height={36} animation="wave" />
      </Stack>

      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Skeleton variant="rounded" height={320} animation="wave" />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
