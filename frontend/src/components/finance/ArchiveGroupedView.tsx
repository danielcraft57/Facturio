import { useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import VisibilityIcon from '@mui/icons-material/Visibility'
import UnarchiveIcon from '@mui/icons-material/Unarchive'
import type { ArchiveYearGroup } from '../../types/archives'
import { financeCardSx, financeTableHeadSx, financeTableSx } from './financeStyles'
import { formatCurrency, formatDate } from '../../utils/formatters'

export type ArchiveRow = {
  id: string | number
  number: string
  clientName: string
  statusLabel: string
  statusColor?: 'default' | 'success' | 'info' | 'warning' | 'error'
  date: string
  total: number
  currency?: string
  archivedAt?: string
  publicToken?: string
}

type ArchiveGroupedViewProps = {
  groups: ArchiveYearGroup<ArchiveRow>[]
  emptyMessage: string
  onView: (row: ArchiveRow) => void
  onRestore?: (id: string | number) => void
  restoringId?: string | number | null
}

function MonthBlock({
  monthLabel,
  items,
  onView,
  onRestore,
  restoringId,
  isMobile,
}: {
  monthLabel: string
  items: ArchiveRow[]
  onView: (row: ArchiveRow) => void
  onRestore?: (id: string | number) => void
  restoringId?: string | number | null
  isMobile: boolean
}) {
  if (isMobile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map((row) => (
          <Card
            key={row.id}
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: alpha('#0f172a', 0.1) }}
          >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack spacing={0.75}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {row.number}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.clientName}
                    </Typography>
                  </Box>
                  <Chip label={row.statusLabel} size="small" color={row.statusColor ?? 'default'} />
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(row.date)}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {formatCurrency(row.total, row.currency)}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <IconButton size="small" title="Voir" onClick={() => onView(row)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  {onRestore && (
                    <IconButton
                      size="small"
                      title="Restaurer"
                      color="primary"
                      disabled={restoringId === row.id}
                      onClick={() => onRestore(row.id)}
                    >
                      <UnarchiveIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    )
  }

  return (
    <TableContainer>
      <Table size="small" sx={financeTableSx}>
        <TableHead sx={financeTableHeadSx}>
          <TableRow>
            <TableCell>N°</TableCell>
            <TableCell>Client</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Statut</TableCell>
            <TableCell align="right">Montant</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={600}>
                  {row.number}
                </Typography>
              </TableCell>
              <TableCell>{row.clientName}</TableCell>
              <TableCell>{formatDate(row.date)}</TableCell>
              <TableCell>
                <Chip label={row.statusLabel} size="small" color={row.statusColor ?? 'default'} />
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={600}>
                  {formatCurrency(row.total, row.currency)}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Stack direction="row" spacing={0.25} justifyContent="center">
                  <IconButton size="small" title="Voir" onClick={() => onView(row)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                  {onRestore && (
                    <IconButton
                      size="small"
                      title="Restaurer"
                      color="primary"
                      disabled={restoringId === row.id}
                      onClick={() => onRestore(row.id)}
                    >
                      <UnarchiveIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export function ArchiveGroupedView({
  groups,
  emptyMessage,
  onView,
  onRestore,
  restoringId,
}: ArchiveGroupedViewProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {}
    if (groups[0]) init[groups[0].year] = true
    return init
  })

  if (groups.length === 0) {
    return (
      <Card sx={financeCardSx}>
        <CardContent sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="text.secondary">{emptyMessage}</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Stack spacing={2}>
      {groups.map((yearGroup) => {
        const yearOpen = expandedYears[yearGroup.year] ?? false
        return (
          <Card key={yearGroup.year} sx={financeCardSx}>
            <Accordion
              expanded={yearOpen}
              onChange={(_, exp) =>
                setExpandedYears((prev) => ({ ...prev, [yearGroup.year]: exp }))
              }
              disableGutters
              elevation={0}
              sx={{
                bgcolor: 'transparent',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  px: { xs: 1.5, sm: 2 },
                  minHeight: 52,
                  background: `linear-gradient(90deg, ${alpha('#0f172a', 0.06)} 0%, transparent 100%)`,
                  '& .MuiAccordionSummary-content': { my: 1 },
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  sx={{ width: '100%', pr: 1 }}
                >
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a' }}>
                    {yearGroup.year}
                  </Typography>
                  <Chip
                    label={`${yearGroup.totalCount} document${yearGroup.totalCount > 1 ? 's' : ''}`}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ px: { xs: 1, sm: 2 }, pb: 2 }}>
                <Stack spacing={2} divider={<Divider flexItem />}>
                  {yearGroup.months.map((monthGroup) => (
                    <Box key={`${yearGroup.year}-${monthGroup.month}`}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{
                          mb: 1.5,
                          color: '#1e3a5f',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          fontSize: '0.8rem',
                        }}
                      >
                        {monthGroup.monthLabel} {yearGroup.year}
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 1, textTransform: 'none', fontWeight: 500 }}
                        >
                          ({monthGroup.items.length})
                        </Typography>
                      </Typography>
                      <MonthBlock
                        monthLabel={monthGroup.monthLabel}
                        items={monthGroup.items}
                        onView={onView}
                        onRestore={onRestore}
                        restoringId={restoringId}
                        isMobile={isMobile || isTablet}
                      />
                    </Box>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Card>
        )
      })}
    </Stack>
  )
}
