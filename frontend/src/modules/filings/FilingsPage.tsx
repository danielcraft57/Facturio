import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Add,
  Calculate,
  Payment,
  Download,
  Edit
} from '@mui/icons-material'
import { filingsService, type Filing } from '../../services/filings'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { PageHeader } from '../../components/finance/PageHeader'
import {
  financeCardSx,
  financePagePadding,
  financePrimaryButtonSx,
  financeTableHeadSx,
  financeTableSx,
} from '../../components/finance/financeStyles'
import { BillingFeatureGate } from '../../components/billing/BillingFeatureGate'
import { Link as RouterLink } from 'react-router-dom'

export function FilingsPage() {
  const [filings, setFilings] = useState<Filing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [periodFilter, setPeriodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [filingType, setFilingType] = useState<Filing['type']>('VAT_CA3')
  const [filingPeriod, setFilingPeriod] = useState(`${new Date().getFullYear() - 1}`)

  useEffect(() => {
    loadFilings()
  }, [periodFilter, statusFilter])

  const loadFilings = async () => {
    try {
      setLoading(true)
      const response = await filingsService.getFilings({
        period: periodFilter || undefined,
        status: statusFilter || undefined
      })
      const payload = (response as any).data?.data ?? (response as any).data
      const list = Array.isArray(payload) ? payload : (payload?.items ?? payload?.filings ?? [])
      setFilings(list)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des déclarations')
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async (id: number) => {
    try {
      await filingsService.calculateFiling(id)
      await loadFilings()
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du calcul')
    }
  }

  const defaultPeriodForType = (type: Filing['type']) => {
    const y = new Date().getFullYear()
    if (type === 'IS' || type === 'CFE') return String(y - 1)
    if (type === 'VAT_CA12' || type === 'URSSAF_MONTHLY') {
      const d = new Date()
      return `${d.getFullYear()}-M${String(d.getMonth() + 1).padStart(2, '0')}`
    }
    const d = new Date()
    const q = Math.floor(d.getMonth() / 3) + 1
    return `${d.getFullYear()}-Q${q}`
  }

  const handleCreateFiling = async () => {
    try {
      await filingsService.createFiling({
        type: filingType,
        period: filingPeriod || defaultPeriodForType(filingType),
      })
      setCreateDialogOpen(false)
      await loadFilings()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'VAT_CA3': return 'TVA CA3'
      case 'VAT_CA12': return 'TVA CA12'
      case 'URSSAF_MONTHLY': return 'URSSAF Mensuel'
      case 'URSSAF_QUARTERLY': return 'URSSAF Trimestriel'
      case 'IS': return 'Impôt sur les sociétés'
      case 'CFE': return 'CFE'
      default: return type
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'default'
      case 'CALCULATED': return 'info'
      case 'FILED': return 'warning'
      case 'PAID': return 'success'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'Brouillon'
      case 'CALCULATED': return 'Calculée'
      case 'FILED': return 'Déposée'
      case 'PAID': return 'Payée'
      default: return status
    }
  }

  return (
    <BillingFeatureGate feature="accounting" featureLabel="Les déclarations fiscales">
    <Box sx={{ p: financePagePadding }}>
      <PageHeader
        title="Déclarations"
        subtitle="TVA, URSSAF et obligations - calculs à partir de votre activité facturée"
        actions={
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/urssaf" variant="outlined">
              URSSAF
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              sx={financePrimaryButtonSx}
            >
              Nouvelle déclaration
            </Button>
          </Stack>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filtres */}
      <Card sx={{ mb: 3, ...financeCardSx }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              sx={{ minWidth: { sm: 200 }, flex: { sm: '1 1 200px' } }}
              label="Période (2025, 2025-Q1, 2025-M01)"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              placeholder="2025"
            />
            <FormControl fullWidth sx={{ minWidth: { sm: 200 }, flex: { sm: '1 1 200px' } }}>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="draft">Brouillon</MenuItem>
                <MenuItem value="calculated">Calculée</MenuItem>
                <MenuItem value="filed">Déposée</MenuItem>
                <MenuItem value="paid">Payée</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Liste des déclarations */}
      <Card sx={financeCardSx}>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : !Array.isArray(filings) || filings.length === 0 ? (
            <Alert severity="info">Aucune déclaration trouvée</Alert>
          ) : (
            <TableContainer>
              <Table size="small" sx={financeTableSx}>
                <TableHead sx={financeTableHeadSx}>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Période</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Montant dû</TableCell>
                    <TableCell align="right">Montant payé</TableCell>
                    <TableCell>Date de création</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(filings ?? []).map((filing) => (
                    <TableRow key={filing.id} hover>
                      <TableCell>{getTypeLabel(filing.type)}</TableCell>
                      <TableCell>{filing.period}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(filing.status)}
                          color={getStatusColor(filing.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {filing.amountDue ? formatCurrency(filing.amountDue) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {filing.amountPaid ? formatCurrency(filing.amountPaid) : '-'}
                      </TableCell>
                      <TableCell>{formatDate(filing.createdAt)}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {(filing.status === 'draft' || filing.status === 'calculated') &&
                            ['VAT_CA3', 'VAT_CA12', 'IS', 'CFE'].includes(filing.type) && (
                            <IconButton
                              size="small"
                              onClick={() => handleCalculate(filing.id)}
                              title="Calculer"
                            >
                              <Calculate />
                            </IconButton>
                          )}
                          {filing.status === 'calculated' && filing.amountDue && (
                            <IconButton
                              size="small"
                              title="Enregistrer paiement"
                            >
                              <Payment />
                            </IconButton>
                          )}
                          <IconButton size="small" title="Voir détails">
                            <Edit />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Dialog création */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle déclaration</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Type de déclaration</InputLabel>
              <Select
                value={filingType}
                label="Type de déclaration"
                onChange={(e) => {
                  const t = e.target.value as Filing['type']
                  setFilingType(t)
                  setFilingPeriod(defaultPeriodForType(t))
                }}
              >
                <MenuItem value="VAT_CA3">TVA CA3 (trimestriel)</MenuItem>
                <MenuItem value="VAT_CA12">TVA CA12 (annuel)</MenuItem>
                <MenuItem value="IS">Impôt sur les sociétés (IS)</MenuItem>
                <MenuItem value="CFE">CFE (cotisation foncière)</MenuItem>
                <MenuItem value="URSSAF_MONTHLY">URSSAF mensuel (préférer /urssaf)</MenuItem>
                <MenuItem value="URSSAF_QUARTERLY">URSSAF trimestriel</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Période"
              fullWidth
              value={filingPeriod}
              onChange={(e) => setFilingPeriod(e.target.value)}
              helperText={
                filingType === 'IS' || filingType === 'CFE'
                  ? 'Année fiscale, ex. 2025'
                  : filingType.startsWith('URSSAF') || filingType === 'VAT_CA12'
                    ? 'Mois YYYY-MNN ou année selon le type'
                    : 'Trimestre YYYY-QN, ex. 2026-Q1'
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateFiling}>
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </BillingFeatureGate>
  )
}
