import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
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
import { invoiceService, parseInvoicesListPage } from '../../../services/invoices'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import { financeTableHeadSx, financeTableSx } from '../../../components/finance/financeStyles'

type DepositRow = {
  id: string
  number: string
  status: string
  issueDate: string
  clientName: string
  total: number
  totalPaid: number
  tags: string[]
}

export function DepositsPanel() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<DepositRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid' | 'credited' | 'refunded'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await invoiceService.getInvoices({
        tag: 'ACOMPTE_10',
        limit: 100,
        sortBy: 'issueDate',
        sortOrder: 'desc',
      })
      const page = parseInvoicesListPage(res)
      const list = page.invoices.map((inv) => {
        const paid = (inv as any).payments?.reduce?.((s: number, p: any) => s + Number(p.amount ?? 0), 0) ?? 0
        return {
          id: inv.id,
          number: inv.number,
          status: inv.status,
          issueDate: inv.issueDate,
          clientName: inv.client?.name ?? '—',
          total: inv.total,
          totalPaid: Number(paid),
          tags: inv.tags ?? [],
        } satisfies DepositRow
      })
      setRows(list)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur chargement acomptes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      const isPaid = r.totalPaid >= r.total - 0.01
      const credited = r.tags.includes('ACOMPTE_CREDITED')
      const refunded = r.tags.includes('ACOMPTE_REFUNDED')
      if (filter === 'paid') return isPaid
      if (filter === 'unpaid') return !isPaid
      if (filter === 'credited') return credited
      if (filter === 'refunded') return refunded
      return true
    })
  }, [rows, filter])

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

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        {([
          ['all', 'Tous'],
          ['paid', 'Payés'],
          ['unpaid', 'À payer'],
          ['credited', 'Crédités'],
          ['refunded', 'Remboursés'],
        ] as const).map(([k, label]) => (
          <Chip
            key={k}
            label={label}
            clickable
            onClick={() => setFilter(k)}
            color={filter === k ? 'primary' : 'default'}
            variant={filter === k ? 'filled' : 'outlined'}
          />
        ))}
      </Stack>

      {visibleRows.length === 0 ? (
        <Alert severity="info">Aucun acompte ne correspond au filtre.</Alert>
      ) : (
        <TableContainer>
          <Table size="small" sx={financeTableSx}>
            <TableHead sx={financeTableHeadSx}>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Facture ACO</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Payé</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{formatDate(r.issueDate)}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.number}</TableCell>
                  <TableCell>{r.clientName}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip size="small" label={r.status} variant="outlined" />
                      {r.tags.includes('ACOMPTE_REFUNDED') && (
                        <Chip size="small" label="Remboursé" color="warning" variant="outlined" />
                      )}
                      {r.tags.includes('ACOMPTE_CREDITED') && (
                        <Chip size="small" label="Crédité" color="primary" variant="outlined" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(r.total)}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700} color={r.totalPaid >= r.total - 0.01 ? 'success.main' : 'text.primary'}>
                      {formatCurrency(r.totalPaid)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ouvrir la facture">
                      <IconButton size="small" onClick={() => navigate(`/factures/${r.id}`)}>
                        <OpenInNew fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Astuce : pour “annuler un acompte” en mode crédit (avoir) ou remboursement, ouvre la facture ACO puis utilise
        l’action “Annuler acompte”.
      </Typography>
    </>
  )
}

