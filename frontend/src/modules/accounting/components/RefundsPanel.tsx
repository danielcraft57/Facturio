import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  CircularProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { OpenInNew } from '@mui/icons-material'
import { refundsService, type RefundListItem } from '../../../services/refunds'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import { financeTableHeadSx, financeTableSx } from '../../../components/finance/financeStyles'

interface RefundsPanelProps {
  startDate: string
  endDate: string
}

export function RefundsPanel({ startDate, endDate }: RefundsPanelProps) {
  const navigate = useNavigate()
  const [rows, setRows] = useState<RefundListItem[]>([])
  const [filter, setFilter] = useState<'all' | 'stripe' | 'manual'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await refundsService.list({ start: startDate, end: endDate, pageSize: 50 })
      setRows(res.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur chargement remboursements')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (rows.length === 0) {
    return (
      <Alert severity="info">
        Aucun remboursement sur la période. Les remboursements sont créés depuis la fiche facture (paiement ou
        annulation d&apos;acompte).
      </Alert>
    )
  }

  const visibleRows = rows.filter((r) => {
    const method = String(r.paymentMethod ?? r.method ?? '').toUpperCase()
    const isStripe = method === 'STRIPE'
    if (filter === 'stripe') return isStripe
    if (filter === 'manual') return !isStripe
    return true
  })

  const totalRefunded = visibleRows.reduce((s, r) => s + Number(r.amount ?? 0), 0)

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {visibleRows.length} remboursement(s)
          </Typography>
          <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 800 }}>
            {formatCurrency(totalRefunded)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="Tous"
            clickable
            onClick={() => setFilter('all')}
            color={filter === 'all' ? 'primary' : 'default'}
            variant={filter === 'all' ? 'filled' : 'outlined'}
          />
          <Chip
            label="Stripe"
            clickable
            onClick={() => setFilter('stripe')}
            color={filter === 'stripe' ? 'primary' : 'default'}
            variant={filter === 'stripe' ? 'filled' : 'outlined'}
          />
          <Chip
            label="Manuel"
            clickable
            onClick={() => setFilter('manual')}
            color={filter === 'manual' ? 'primary' : 'default'}
            variant={filter === 'manual' ? 'filled' : 'outlined'}
          />
        </Box>
      </Box>

      {visibleRows.length === 0 ? (
        <Alert severity="info">Aucun remboursement ne correspond au filtre.</Alert>
      ) : (
        <TableContainer>
          <Table size="small" sx={financeTableSx}>
            <TableHead sx={financeTableHeadSx}>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Facture</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Motif</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                      {r.invoiceNumber ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.clientName ?? '—'}</TableCell>
                  <TableCell>{r.reason ?? r.notes ?? '—'}</TableCell>
                  <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 700 }}>
                    {formatCurrency(r.amount)}
                  </TableCell>
                  <TableCell align="right">
                    {r.invoiceId && (
                      <Tooltip title="Ouvrir la facture">
                        <IconButton size="small" onClick={() => navigate(`/factures/${r.invoiceId}`)}>
                          <OpenInNew fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  )
}
