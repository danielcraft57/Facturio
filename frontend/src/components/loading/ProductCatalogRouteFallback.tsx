import { Box, Skeleton, Stack } from '@mui/material'
import { financePagePadding } from '../finance/financeStyles'
import { ProductCatalogInitialLoader } from './ProductCatalogInitialLoader'

/** Fallback Suspense (chunk JS) — même structure que ProductsPage. */
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

      <ProductCatalogInitialLoader initial />
    </Box>
  )
}
