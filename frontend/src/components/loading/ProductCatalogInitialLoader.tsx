import { Box, Grid, Skeleton } from '@mui/material'
import { WorkspacePreparationDialog } from './WorkspacePreparationDialog'

type Props = {
  /** Premier chargement après F5 (message plus explicite). */
  initial?: boolean
}

/** Attente chargement catalogue — popin + grille squelette. */
export function ProductCatalogInitialLoader({ initial = false }: Props) {
  return (
    <Box sx={{ py: initial ? 1 : 2 }}>
      <WorkspacePreparationDialog open resource="catalogue" refreshing={!initial} />
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
