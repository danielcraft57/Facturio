import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { PageHeader } from '../../components/finance/PageHeader'
import { financePagePadding, financePrimaryButtonSx } from '../../components/finance/financeStyles'
import { BillingFeatureGate } from '../../components/billing/BillingFeatureGate'
import { formatCurrency } from '../../utils/formatters'
import { amortizationsService, type Amortization } from '../../services/amortizations'

/**
 * Page amortissements d'immobilisations (API taxes déjà existante).
 */
export function AmortizationsPage() {
  const year = new Date().getFullYear()
  const [rows, setRows] = useState<Amortization[]>([])
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState({
    assetName: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchaseAmount: 0,
    method: 'LINEAR' as 'LINEAR' | 'DECLINING' | 'EXCEPTIONAL',
    duration: 3,
  })

  const load = useCallback(async () => {
    const [list, totals] = await Promise.all([
      amortizationsService.list(year).catch(() => []),
      amortizationsService.totals(year).catch(() => ({ year, total: 0 })),
    ])
    setRows(list)
    setTotal(Number(totals.total) || 0)
  }, [year])

  useEffect(() => {
    load()
  }, [load])

  const create = async () => {
    if (!form.assetName.trim() || form.purchaseAmount <= 0) return
    await amortizationsService.create(form)
    setOpen(false)
    setForm({
      assetName: '',
      purchaseDate: new Date().toISOString().slice(0, 10),
      purchaseAmount: 0,
      method: 'LINEAR',
      duration: 3,
    })
    load()
  }

  return (
    <BillingFeatureGate feature="accounting" featureLabel="Les amortissements">
      <Box sx={{ p: financePagePadding }}>
        <PageHeader
          title="Amortissements"
          subtitle={`Immobilisations et dotations ${year}`}
          actions={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    const r = await amortizationsService.postAllYear(year)
                    setMsg(
                      `${r.postedCount} écriture(s) 681/281 - total ${formatCurrency(r.totalAmount)}` +
                        (r.skippedCount ? ` (${r.skippedCount} ignorée(s))` : ''),
                    )
                    load()
                  } catch {
                    setMsg('Comptabilisation impossible')
                  }
                }}
              >
                Comptabiliser {year}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpen(true)}
                sx={financePrimaryButtonSx}
              >
                Nouveau bien
              </Button>
            </Stack>
          }
        />

        {msg && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {msg}
          </Typography>
        )}

        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Dotations {year} : {formatCurrency(total)}
        </Typography>

        {rows.length === 0 ? (
          <Typography color="text.secondary">Aucun amortissement enregistré.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Bien</TableCell>
                <TableCell>Achat</TableCell>
                <TableCell>Méthode</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell align="right">Durée</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.assetName}</TableCell>
                  <TableCell>{String(r.purchaseDate).slice(0, 10)}</TableCell>
                  <TableCell>{r.method}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(r.purchaseAmount))}</TableCell>
                  <TableCell align="right">{r.duration} ans</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        onClick={async () => {
                          try {
                            await amortizationsService.postYear(r.id, year)
                            setMsg(`Dotation comptabilisée pour ${r.assetName}`)
                          } catch (err: unknown) {
                            setMsg((err as Error).message || 'Déjà comptabilisé ou erreur')
                          }
                        }}
                      >
                        Compta
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => amortizationsService.remove(r.id).then(load)}
                      >
                        Supprimer
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle>Nouvel amortissement</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Nom du bien"
                fullWidth
                value={form.assetName}
                onChange={(e) => setForm((f) => ({ ...f, assetName: e.target.value }))}
              />
              <TextField
                label="Date d'achat"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.purchaseDate}
                onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
              />
              <TextField
                label="Montant"
                type="number"
                fullWidth
                value={form.purchaseAmount || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, purchaseAmount: parseFloat(e.target.value) || 0 }))
                }
              />
              <TextField
                select
                label="Méthode"
                fullWidth
                value={form.method}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    method: e.target.value as 'LINEAR' | 'DECLINING' | 'EXCEPTIONAL',
                  }))
                }
              >
                <MenuItem value="LINEAR">Linéaire</MenuItem>
                <MenuItem value="DECLINING">Dégressif</MenuItem>
                <MenuItem value="EXCEPTIONAL">Exceptionnel</MenuItem>
              </TextField>
              <TextField
                label="Durée (années)"
                type="number"
                fullWidth
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: parseInt(e.target.value, 10) || 1 }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Annuler</Button>
            <Button variant="contained" onClick={create}>
              Créer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BillingFeatureGate>
  )
}
