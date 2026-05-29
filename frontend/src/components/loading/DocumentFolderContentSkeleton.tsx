import {
  Box,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {
  documentFolderTableCardSx,
  documentFolderTableContainerSx,
  documentFolderTableSx,
} from '../finance/documentFolderStyles'
import { financeTableHeadSx } from '../finance/financeStyles'

export type DocumentFolderContentSkeletonProps = {
  rows?: number
  /** Affichage type tableau (desktop) ou cartes (mobile). */
  variant?: 'table' | 'cards'
  /** Premier chargement (F5) : message explicite. */
  initial?: boolean
  resourceLabel?: string
}

function TableRowSkeleton({ index }: { index: number }) {
  return (
    <TableRow>
      <TableCell padding="checkbox" sx={{ width: 72 }}>
        <Skeleton variant="rounded" width={56} height={28} animation="wave" />
      </TableCell>
      <TableCell>
        <Skeleton variant="text" width={`${55 - index * 4}%`} height={22} animation="wave" />
      </TableCell>
      <TableCell>
        <Skeleton variant="text" width="70%" height={22} animation="wave" />
      </TableCell>
      <TableCell>
        <Skeleton variant="rounded" width={72} height={24} animation="wave" />
      </TableCell>
      <TableCell align="right">
        <Skeleton variant="text" width={64} height={22} sx={{ ml: 'auto' }} animation="wave" />
      </TableCell>
      <TableCell align="center">
        <Skeleton variant="circular" width={28} height={28} sx={{ mx: 'auto' }} animation="wave" />
      </TableCell>
    </TableRow>
  )
}

function CardRowSkeleton({ index }: { index: number }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton variant="text" width={`${70 - index * 5}%`} height={22} animation="wave" />
          <Skeleton variant="text" width="50%" height={18} sx={{ mt: 0.5 }} animation="wave" />
        </Box>
        <Skeleton variant="rounded" width={56} height={24} animation="wave" />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
        <Skeleton variant="rounded" width={80} height={32} animation="wave" />
        <Skeleton variant="rounded" width={80} height={32} animation="wave" />
      </Stack>
    </Box>
  )
}

/** Squelette du contenu principal (liste / tableau) pendant le chargement. */
export function DocumentFolderContentSkeleton({
  rows = 8,
  variant = 'table',
  initial = false,
  resourceLabel = 'documents',
}: DocumentFolderContentSkeletonProps) {
  const label = resourceLabel

  return (
    <Card sx={documentFolderTableCardSx}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        {initial && (
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <Skeleton variant="circular" width={10} height={10} animation="wave" />
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Chargement des {label}…
            </Typography>
          </Stack>
        )}

        {variant === 'table' ? (
          <TableContainer sx={documentFolderTableContainerSx}>
            <Table size="small" sx={documentFolderTableSx}>
              <TableHead sx={financeTableHeadSx}>
                <TableRow>
                  {['', 'Tags', 'N°', 'Client', 'Statut', 'Montant', 'Actions'].map((col) => (
                    <TableCell key={col}>
                      <Skeleton variant="text" width={col ? '75%' : 40} height={20} animation="wave" />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: rows }).map((_, i) => (
                  <TableRowSkeleton key={i} index={i} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Stack spacing={1.25}>
            {Array.from({ length: Math.min(rows, 6) }).map((_, i) => (
              <CardRowSkeleton key={i} index={i} />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
