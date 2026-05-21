import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Button,
  Stack,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Download,
  AccountBalance,
  Book,
  Assessment
} from '@mui/icons-material'
import { accountingService, type Account, type TrialBalance, type GeneralLedgerEntry } from '../../services/accounting'
import { unwrapApiPayload } from '../../services/clients'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { PageHeader } from '../../components/finance/PageHeader'
import { financeCardSx, financePagePadding, financePrimaryButtonSx } from '../../components/finance/financeStyles'

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

function unwrapList<T>(
  response: unknown,
  keys: Array<'items' | 'accounts' | 'trialBalance' | 'entries'>
): T[] {
  const payload = unwrapApiPayload<T[] | Partial<Record<(typeof keys)[number], T[]>>>(response)
  if (Array.isArray(payload)) return payload
  for (const key of keys) {
    const list = payload[key]
    if (Array.isArray(list)) return list
  }
  return []
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export function AccountingPage() {
  const [tabValue, setTabValue] = useState(0)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [trialBalance, setTrialBalance] = useState<TrialBalance[]>([])
  const [generalLedger, setGeneralLedger] = useState<GeneralLedgerEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedAccount, setSelectedAccount] = useState<string>('')

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (tabValue === 1) {
      loadTrialBalance()
    } else if (tabValue === 2) {
      loadGeneralLedger()
    }
  }, [tabValue, startDate, endDate, selectedAccount])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await accountingService.getAccounts()
      setAccounts(unwrapList<Account>(response, ['accounts', 'items']))
    } catch (err: unknown) {
      setError(errorMessage(err, 'Erreur lors du chargement des comptes'))
    } finally {
      setLoading(false)
    }
  }

  const loadTrialBalance = async () => {
    try {
      setLoading(true)
      const response = await accountingService.getTrialBalance(startDate, endDate)
      setTrialBalance(unwrapList<TrialBalance>(response, ['items', 'trialBalance']))
    } catch (err: unknown) {
      setError(errorMessage(err, 'Erreur lors du chargement de la balance'))
    } finally {
      setLoading(false)
    }
  }

  const loadGeneralLedger = async () => {
    try {
      setLoading(true)
      const response = await accountingService.getGeneralLedger(
        startDate,
        endDate,
        selectedAccount || undefined
      )
      setGeneralLedger(unwrapList<GeneralLedgerEntry>(response, ['items', 'entries']))
    } catch (err: unknown) {
      setError(errorMessage(err, 'Erreur lors du chargement du grand livre'))
    } finally {
      setLoading(false)
    }
  }

  const handleExportFEC = async () => {
    try {
      const blob = await accountingService.exportFEC(startDate, endDate)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `fec_${startDate}_${endDate}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setError(errorMessage(err, 'Erreur lors de l\'export FEC'))
    }
  }

  const safeAccounts = Array.isArray(accounts) ? accounts : []

  return (
    <Box sx={{ p: financePagePadding }}>
      <PageHeader
        title="Comptabilité"
        subtitle="Plan comptable, balance des comptes, grand livre et export FEC"
        actions={
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportFEC}
            sx={financePrimaryButtonSx}
          >
            Exporter FEC
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3, ...financeCardSx }}>
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <TextField
              fullWidth
              sx={{ minWidth: { sm: 200 }, flex: { sm: '1 1 200px' } }}
              label="Date de début"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              sx={{ minWidth: { sm: 200 }, flex: { sm: '1 1 200px' } }}
              label="Date de fin"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            {tabValue === 2 && (
              <FormControl
                fullWidth
                sx={{ minWidth: { sm: 200 }, flex: { sm: '1 1 200px' } }}
              >
                <InputLabel>Compte</InputLabel>
                <Select
                  value={selectedAccount}
                  label="Compte"
                  onChange={(e) => setSelectedAccount(e.target.value)}
                >
                  <MenuItem value="">Tous les comptes</MenuItem>
                  {safeAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.code}>
                      {account.code} - {account.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={financeCardSx}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab icon={<AccountBalance />} label="Plan comptable" />
            <Tab icon={<Assessment />} label="Balance" />
            <Tab icon={<Book />} label="Grand livre" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : safeAccounts.length === 0 ? (
            <Alert severity="info">Aucun compte trouvé</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {safeAccounts.map((account) => (
                    <TableRow key={account.id} hover>
                      <TableCell>{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.type}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : trialBalance.length === 0 ? (
            <Alert severity="info">Aucune donnée pour la période sélectionnée</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Compte</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell align="right">Débit initial</TableCell>
                    <TableCell align="right">Crédit initial</TableCell>
                    <TableCell align="right">Débit période</TableCell>
                    <TableCell align="right">Crédit période</TableCell>
                    <TableCell align="right">Débit final</TableCell>
                    <TableCell align="right">Crédit final</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trialBalance.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{item.account.code}</TableCell>
                      <TableCell>{item.account.name}</TableCell>
                      <TableCell align="right">{formatCurrency(item.openingDebit)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.openingCredit)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.periodDebit)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.periodCredit)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.closingDebit)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.closingCredit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : generalLedger.length === 0 ? (
            <Alert severity="info">Aucune écriture pour la période sélectionnée</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Journal</TableCell>
                    <TableCell>Référence</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Débit</TableCell>
                    <TableCell align="right">Crédit</TableCell>
                    <TableCell align="right">Solde</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generalLedger.map((entry, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>{entry.journal}</TableCell>
                      <TableCell>{entry.reference || '-'}</TableCell>
                      <TableCell>{entry.description || '-'}</TableCell>
                      <TableCell align="right">{formatCurrency(entry.debit)}</TableCell>
                      <TableCell align="right">{formatCurrency(entry.credit)}</TableCell>
                      <TableCell align="right">{formatCurrency(entry.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Card>
    </Box>
  )
}
