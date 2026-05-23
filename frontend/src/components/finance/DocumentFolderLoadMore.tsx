import { Box, Button, CircularProgress, Typography } from '@mui/material'

type DocumentFolderLoadMoreProps = {
  loaded: number
  total: number
  loading?: boolean
  onLoadMore: () => void
}

export function DocumentFolderLoadMore({
  loaded,
  total,
  loading = false,
  onLoadMore,
}: DocumentFolderLoadMoreProps) {
  if (total <= 0 || loaded >= total) return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2, gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {loaded} sur {total} affiché{loaded > 1 ? 's' : ''}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        onClick={onLoadMore}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} /> : undefined}
      >
        {loading ? 'Chargement…' : 'Charger plus'}
      </Button>
    </Box>
  )
}
