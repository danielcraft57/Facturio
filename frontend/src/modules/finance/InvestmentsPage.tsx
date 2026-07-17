import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { PageHeader } from '../../components/finance/PageHeader'
import {
  financeCardSx,
  financeKpiGradients,
  financePagePadding,
  financePrimaryButtonSx,
} from '../../components/finance/financeStyles'
import { BillingFeatureGate } from '../../components/billing/BillingFeatureGate'
import { formatCurrency } from '../../utils/formatters'
import {
  investmentsService,
  type Investment,
  type InvestmentSummary,
  type Investor,
} from '../../services/investments'

/**
 * Page investisseurs et investissements (apports, prêts, subventions).
 */
export function InvestmentsPage() {
  const [summary, setSummary] = useState<InvestmentSummary | null>(null)
  const [investors, setInvestors] = useState<Investor[]>([])
  const [rows, setRows] = useState<Investment[]>([])
  const [openInv, setOpenInv] = useState(false)
  const [openInvestor, setOpenInvestor] = useState(false)
  const [investorName, setInvestorName] = useState('')
  const [form, setForm] = useState({
    label: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    type: 'CAPITAL_CONTRIBUTION',
    investorId: '' as string | number,
    postAccounting: true,
  })

  const load = useCallback(async () => {
    const [s, inv, list] = await Promise.all([
      investmentsService.getSummary().catch(() => null),
      investmentsService.listInvestors().catch(() => []),
      investmentsService.list().catch(() => []),
    ])
    setSummary(s)
    setInvestors(inv)
    setRows(list)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const createInvestor = async () => {
    if (!investorName.trim()) return
    await investmentsService.createInvestor({ name: investorName })
    setOpenInvestor(false)
    setInvestorName('')
    load()
  }

  const createInvestment = async () => {
    if (!form.label.trim() || form.amount <= 0) return
    await investmentsService.create({
      label: form.label,
      amount: form.amount,
      date: form.date,
      type: form.type,
      investorId: form.investorId === '' ? undefined : Number(form.investorId),
      postAccounting: form.postAccounting,
    })
    setOpenInv(false)
    setForm({
      label: '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      type: 'CAPITAL_CONTRIBUTION',
      investorId: '',
      postAccounting: true,
    })
    load()
  }

  return (
    <BillingFeatureGate feature="accounting" featureLabel="Les investissements">
      <Box sx={{ p: financePagePadding }}>
        <PageHeader
          title="Investissements"
          subtitle="Apports en capital, prêts et subventions"
          actions={
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setOpenInvestor(true)}>
                Investisseur
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenInv(true)}
                sx={financePrimaryButtonSx}
              >
                Nouvel apport
              </Button>
            </Stack>
          }
        />

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={financeCardSx}>
              <Box sx={{ height: 4, background: financeKpiGradients.revenue }} />
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Actifs
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {formatCurrency(summary?.totalActive ?? 0)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={financeCardSx}>
              <Box sx={{ height: 4, background: financeKpiGradients.clients }} />
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Opérations
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {summary?.count ?? 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card sx={financeCardSx}>
              <Box sx={{ height: 4, background: financeKpiGradients.unpaid }} />
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Investisseurs
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {investors.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Libellé</TableCell>
              <TableCell>Investisseur</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Montant</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{String(r.date).slice(0, 10)}</TableCell>
                <TableCell>{r.label}</TableCell>
                <TableCell>{r.investor?.name || '-'}</TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell align="right">{formatCurrency(Number(r.amount))}</TableCell>
                <TableCell>
                  <Chip size="small" label={r.status} color={r.status === 'ACTIVE' ? 'success' : 'default'} />
                </TableCell>
                <TableCell>
                  {r.status === 'ACTIVE' && (
                    <Button size="small" onClick={() => investmentsService.close(r.id).then(load)}>
                      Clôturer
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={openInvestor} onClose={() => setOpenInvestor(false)} fullWidth maxWidth="xs">
          <DialogTitle>Nouvel investisseur</DialogTitle>
          <DialogContent>
            <TextField
              sx={{ mt: 1 }}
              label="Nom"
              fullWidth
              value={investorName}
              onChange={(e) => setInvestorName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenInvestor(false)}>Annuler</Button>
            <Button variant="contained" onClick={createInvestor}>
              Créer
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={openInv} onClose={() => setOpenInv(false)} fullWidth maxWidth="sm">
          <DialogTitle>Nouvel investissement</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Libellé"
                fullWidth
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
              <TextField
                label="Montant"
                type="number"
                fullWidth
                value={form.amount || ''}
                onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              />
              <TextField
                label="Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
              <TextField
                select
                label="Type"
                fullWidth
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              >
                <MenuItem value="CAPITAL_CONTRIBUTION">Apport en capital</MenuItem>
                <MenuItem value="LOAN">Prêt</MenuItem>
                <MenuItem value="GRANT">Subvention</MenuItem>
                <MenuItem value="OTHER">Autre</MenuItem>
              </TextField>
              <TextField
                select
                label="Investisseur"
                fullWidth
                value={form.investorId}
                onChange={(e) => setForm((f) => ({ ...f, investorId: e.target.value }))}
              >
                <MenuItem value="">Aucun</MenuItem>
                {investors.map((i) => (
                  <MenuItem key={i.id} value={i.id}>
                    {i.name}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenInv(false)}>Annuler</Button>
            <Button variant="contained" onClick={createInvestment}>
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </BillingFeatureGate>
  )
}
