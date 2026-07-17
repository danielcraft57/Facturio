import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import CalculateIcon from '@mui/icons-material/Calculate'
import AddIcon from '@mui/icons-material/Add'
import { Link as RouterLink } from 'react-router-dom'
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
  urssafService,
  type UrssafCalculation,
  type UrssafContribution,
} from '../../services/urssaf'

function currentMonthPeriod(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-M${m}`
}

function monthBounds(period: string): { start: string; end: string } | null {
  const match = period.match(/^(\d{4})-M(\d{2})$/)
  if (!match) return null
  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

/**
 * Page cotisations URSSAF : calcul, création de déclaration, historique.
 */
export function UrssafPage() {
  const [period, setPeriod] = useState(currentMonthPeriod())
  const [calc, setCalc] = useState<UrssafCalculation | null>(null)
  const [rows, setRows] = useState<UrssafContribution[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    urssafService
      .listContributions()
      .then(setRows)
      .catch(() => setRows([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCalculate = async () => {
    const bounds = monthBounds(period)
    if (!bounds) {
      setError('Format période : YYYY-MNN (ex. 2026-M07)')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const result = await urssafService.calculate(bounds.start, bounds.end)
      setCalc(result)
    } catch (err: unknown) {
      setError((err as Error).message || 'Calcul impossible')
      setCalc(null)
    } finally {
      setBusy(false)
    }
  }

  const handleCreateFiling = async () => {
    setBusy(true)
    setError(null)
    try {
      await urssafService.createFiling(period)
      load()
    } catch (err: unknown) {
      setError((err as Error).message || 'Création impossible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BillingFeatureGate feature="accounting" featureLabel="Les cotisations URSSAF">
      <Box sx={{ p: financePagePadding }}>
        <PageHeader
          title="URSSAF"
          subtitle="Cotisations micro-entreprise / auto-entrepreneur à partir de votre CA facturé"
          actions={
            <Button component={RouterLink} to="/declarations" variant="outlined">
              Toutes les déclarations
            </Button>
          }
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 3, ...financeCardSx }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <TextField
                label="Période"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                helperText="Mensuel : 2026-M07 - Trimestriel : 2026-Q1"
                sx={{ minWidth: 180 }}
              />
              <TextField
                select
                label="Raccourci"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                {[0, 1, 2].map((offset) => {
                  const d = new Date()
                  d.setMonth(d.getMonth() - offset)
                  const p = `${d.getFullYear()}-M${String(d.getMonth() + 1).padStart(2, '0')}`
                  return (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  )
                })}
              </TextField>
              <Button
                variant="outlined"
                startIcon={<CalculateIcon />}
                onClick={handleCalculate}
                disabled={busy}
              >
                Calculer
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateFiling}
                disabled={busy}
                sx={financePrimaryButtonSx}
              >
                Créer la déclaration
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {calc && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={financeCardSx}>
                <Box sx={{ height: 4, background: financeKpiGradients.revenue }} />
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    CA période
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {formatCurrency(calc.ca)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={financeCardSx}>
                <Box sx={{ height: 4, background: financeKpiGradients.conversion }} />
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Taux
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {(calc.rate * 100).toFixed(1)} %
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={financeCardSx}>
                <Box sx={{ height: 4, background: financeKpiGradients.unpaid }} />
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Cotisation
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {formatCurrency(calc.contribution)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Card sx={financeCardSx}>
                <Box sx={{ height: 4, background: financeKpiGradients.clients }} />
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Factures
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {calc.invoicesCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Historique
        </Typography>
        {rows.length === 0 ? (
          <Typography color="text.secondary">Aucune déclaration URSSAF pour l&apos;instant.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Période</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Échéance</TableCell>
                <TableCell align="right">Montant dû</TableCell>
                <TableCell>Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {String(r.periodStart).slice(0, 10)} → {String(r.periodEnd).slice(0, 10)}
                  </TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{String(r.dueDate).slice(0, 10)}</TableCell>
                  <TableCell align="right">{formatCurrency(Number(r.amountDue))}</TableCell>
                  <TableCell>
                    <Chip size="small" label={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </BillingFeatureGate>
  )
}
