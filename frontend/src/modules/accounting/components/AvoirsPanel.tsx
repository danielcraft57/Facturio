import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material'
import { OpenInNew } from '@mui/icons-material'
import { avoirsService, type Avoir } from '../../../services/avoirs'
import { formatCurrency, formatDate } from '../../../utils/formatters'
import { financeTableHeadSx, financeTableSx } from '../../../components/finance/financeStyles'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Émis',
  APPLIED: 'Imputé',
  CANCELLED: 'Annulé',
}

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'success' | 'error'> = {
  DRAFT: 'default',
  SENT: 'primary',
  APPLIED: 'success',
  CANCELLED: 'error',
}

export function AvoirsPanel() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Avoir[]>([])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applyTarget, setApplyTarget] = useState<Avoir | null>(null)
  const [applyInvoiceId, setApplyInvoiceId] = useState('')
  const [applyAmount, setApplyAmount] = useState(0)
  const [applying, setApplying] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await avoirsService.list({ pageSize: 50 })
      setRows(res.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur chargement avoirs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openApply = (avoir: Avoir) => {
    setApplyTarget(avoir)
    setApplyInvoiceId(avoir.invoiceId ?? '')
    setApplyAmount(avoir.balance > 0 ? avoir.balance : avoir.total - avoir.appliedAmount)
  }

  const handleApply = async () => {
    if (!applyTarget || !applyInvoiceId || applyAmount <= 0) return
    setApplying(true)
    try {
      await avoirsService.apply(applyTarget.id, applyInvoiceId, applyAmount)
      setApplyTarget(null)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Imputation impossible')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  const visibleRows = showAll
    ? rows
    : rows.filter((a) => {
        const remaining = a.balance ?? a.total - (a.appliedAmount ?? 0)
        return remaining > 0.01 && a.status !== 'CANCELLED'
      })

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
        <Chip
          label="Crédits disponibles"
          clickable
          onClick={() => setShowAll(false)}
          color={!showAll ? 'primary' : 'default'}
          variant={!showAll ? 'filled' : 'outlined'}
        />
        <Chip
          label="Tout afficher"
          clickable
          onClick={() => setShowAll(true)}
          color={showAll ? 'primary' : 'default'}
          variant={showAll ? 'filled' : 'outlined'}
        />
      </Stack>

      {visibleRows.length === 0 ? (
        <Alert severity="info">
          {showAll
            ? "Aucun avoir enregistré. Créez un avoir depuis une facture (bouton « Créer un avoir ») ou via l'annulation d'un acompte."
            : "Aucun crédit client disponible (avoirs avec reste à imputer)."}
        </Alert>
      ) : (
        <TableContainer>
          <Table size="small" sx={financeTableSx}>
            <TableHead sx={financeTableHeadSx}>
              <TableRow>
                <TableCell>Numéro</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Facture liée</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Reste</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map((a) => {
                const remaining = a.balance ?? a.total - (a.appliedAmount ?? 0)
                return (
                  <TableRow key={a.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{a.number}</TableCell>
                    <TableCell>{formatDate(a.date)}</TableCell>
                    <TableCell>{a.client?.name ?? '—'}</TableCell>
                    <TableCell>{a.invoice?.number ?? '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={STATUS_LABELS[a.status] ?? a.status}
                        color={STATUS_COLOR[a.status] ?? 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">{formatCurrency(a.total)}</TableCell>
                    <TableCell align="right">{formatCurrency(remaining)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {remaining > 0.01 && a.status !== 'CANCELLED' && (
                          <Button size="small" onClick={() => openApply(a)}>
                            Imputer
                          </Button>
                        )}
                        {a.invoiceId && (
                          <Tooltip title="Facture liée">
                            <IconButton size="small" onClick={() => navigate(`/factures/${a.invoiceId}`)}>
                              <OpenInNew fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(applyTarget)} onClose={() => !applying && setApplyTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Imputer l&apos;avoir {applyTarget?.number}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="ID facture cible"
              fullWidth
              value={applyInvoiceId}
              onChange={(e) => setApplyInvoiceId(e.target.value)}
              helperText="Par défaut : facture d'origine de l'avoir"
            />
            <TextField
              label="Montant à imputer"
              type="number"
              fullWidth
              value={applyAmount}
              onChange={(e) => setApplyAmount(Number(e.target.value))}
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyTarget(null)} disabled={applying}>
            Annuler
          </Button>
          <Button variant="contained" onClick={handleApply} disabled={applying}>
            Imputer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
