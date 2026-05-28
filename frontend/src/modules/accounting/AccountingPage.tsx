import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Button,
  Stack,
  Tabs,
  Tab,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Typography,
  Chip,
  Grid,
  InputAdornment,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Download,
  Book,
  Assessment,
  Sync,
  ReceiptLong,
  School,
  Search,
  ExpandMore,
  MoneyOff,
  CreditScore,
  Savings,
} from '@mui/icons-material'
import {
  accountingService,
  type Account,
  type TrialBalanceRow,
  type AccountingMovement,
  type FinanceSummary,
} from '../../services/accounting'
import { unwrapApiPayload } from '../../services/clients'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { PageHeader } from '../../components/finance/PageHeader'
import {
  financeCardSx,
  financeKpiGradients,
  financePagePadding,
  financePrimaryButtonSx,
  financeOutlinedButtonSx,
  financeTableHeadSx,
  financeTableSx,
} from '../../components/finance/financeStyles'
import { flattenGeneralLedger, ACCOUNT_CODE_HINTS, type FlatLedgerRow } from './accountingMappers'
import {
  filterMovementsByKind,
  movementKindColor,
  movementKindLabel,
  type MovementKind,
} from './accountingMovementUi'
import { RefundsPanel } from './components/RefundsPanel'
import { AvoirsPanel } from './components/AvoirsPanel'
import { DepositsPanel } from './components/DepositsPanel'
import { subscribeFinanceRealtime, connectFinanceRealtime } from '../../services/financeRealtime'

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

type GlossaryRow = {
  key: string
  label: string
  description: string
  examples?: string[]
}

const GLOSSARY: GlossaryRow[] = [
  {
    key: 'PCG',
    label: 'PCG',
    description: 'Plan Comptable Général (France) : numéros normalisés des comptes (ex: 411, 706).',
  },
  {
    key: 'HT_TTC_TVA',
    label: 'HT / TVA / TTC',
    description:
      'HT = hors taxes, TVA = taxe sur la valeur ajoutée, TTC = HT + TVA. En compta, la TVA collectée va souvent sur 44571.',
    examples: ['HT 1000 + TVA 200 = TTC 1200'],
  },
  {
    key: 'DEBIT_CREDIT',
    label: 'Débit / Crédit',
    description:
      'Les écritures sont en partie double : la somme des débits = la somme des crédits. Le sens dépend du type de compte.',
  },
  {
    key: 'ECRITURE',
    label: 'Écriture',
    description:
      'Un enregistrement comptable (journal + date + référence) composé de lignes (comptes) avec un débit ou un crédit.',
  },
  {
    key: 'JOURNAL',
    label: 'Journal',
    description:
      'Registre des écritures par nature d’opération. Ici : VE (Ventes), BQ (Banque), OD (Opérations diverses).',
  },
  {
    key: 'LETTRAGE',
    label: 'Lettrage',
    description:
      'Association d’une facture et de son règlement (ex: 411 avec 512) pour suivre ce qui est soldé. Pas encore exposé dans l’UI.',
  },
  {
    key: 'REMBOURSEMENT',
    label: 'Remboursement',
    description:
      'Sortie de trésorerie liée à un encaissement annulé : écriture BQ D 411 / C 512. Référence REMBOURSEMENT FAC-…#id.',
    examples: ['Annulation acompte 10 % après rétractation client'],
  },
  {
    key: 'AVOIR',
    label: 'Avoir',
    description:
      'Note de crédit qui annule tout ou partie d’une vente : écriture VE inverse (D 411 / C 706 + 44571). Numéro AVO-YYYY-NNNN.',
  },
  {
    key: 'URSSAF',
    label: 'URSSAF / charges sociales',
    description:
      'Les charges sociales sont constatées principalement sur 641 (salaires) et 645 (charges sociales), avec une dette URSSAF en 431.',
    examples: ['Paie : D 641 + D 645 / C 421 + C 431', 'Paiement URSSAF : D 431 / C 512'],
  },
  {
    key: 'IMPOTS_TAXES',
    label: 'Impôts & taxes (CFE, autres)',
    description:
      'Les impôts et taxes autres que l’IS passent souvent par 63x (ex: 635 pour CFE, C3S…) et 447 pour la dette fiscale associée.',
    examples: ['C3S : D 635 / C 447'],
  },
  {
    key: 'ACHATS',
    label: 'Achats & services externes',
    description:
      'Les achats et prestations externes passent typiquement par 606 (achats non stockés), 615 (entretien), 622 (honoraires), avec TVA déductible en 44566 et fournisseur en 401.',
    examples: ['Prestation : D 622 + D 44566 / C 401'],
  },
  {
    key: 'VENTE_ENCAISSEMENT',
    label: 'Vente & encaissement',
    description:
      'Facturio enregistre la vente à l’émission (VE : D 411 / C 706 + 44571) et l’encaissement à la date de paiement (BQ : D 512 / C 411).',
    examples: ['Vente : D 411 / C 706 + 44571', 'Paiement : D 512 / C 411'],
  },
  {
    key: 'AVOIR_VS_REMBOURSEMENT',
    label: 'Avoir (crédit client) vs remboursement',
    description:
      'Important : un remboursement est une sortie de trésorerie (BQ) ; un avoir corrige la vente et la TVA (VE). Si tu veux “créditer” le client pour une prochaine facture, utilise un avoir non imputé (crédit disponible), puis impute-le sur la prochaine facture.',
    examples: [
      'Avoir (corrige CA + TVA) : VE D 411 / C 706 + C 44571',
      'Remboursement (sortie banque) : BQ D 411 / C 512',
      'Crédit client : avoir émis (reste > 0) puis imputation sur facture suivante',
    ],
  },
]

function AccountingGuide({
  accounts,
}: {
  accounts: Account[]
}) {
  const theme = useTheme()
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()

  const accountRows = accounts
    .map((a) => ({
      code: a.code,
      name: a.name,
      hint: ACCOUNT_CODE_HINTS[a.code],
      type: a.type,
    }))
    .sort((a, b) => a.code.localeCompare(b.code))

  const filteredAccounts = !q
    ? accountRows
    : accountRows.filter((a) => {
        const hay = `${a.code} ${a.name} ${a.hint ?? ''} ${a.type}`.toLowerCase()
        return hay.includes(q)
      })

  const filteredGlossary = !q
    ? GLOSSARY
    : GLOSSARY.filter((g) => `${g.label} ${g.description} ${(g.examples ?? []).join(' ')}`.toLowerCase().includes(q))

  return (
    <Stack spacing={2}>
      <Card
        sx={{
          ...financeCardSx,
          background:
            theme.palette.mode === 'dark'
              ? alpha('#0f172a', 0.35)
              : 'linear-gradient(145deg, rgba(15,23,42,0.04) 0%, rgba(30,58,95,0.02) 100%)',
        }}
      >
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h6" fontWeight={800}>
              Guide compta (interactif)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
              Comprendre rapidement les journaux, les sigles et les comptes affichés dans Facturio. Tape un mot-clé
              (ex: <b>411</b>, <b>TVA</b>, <b>VE</b>, <b>débit</b>) et le guide filtre automatiquement.
            </Typography>
            <TextField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un compte, un sigle ou un terme…"
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 560 }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Accordion defaultExpanded sx={financeCardSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={800}>Journaux & abréviations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={1.25}>
            <Typography variant="body2" color="text.secondary">
              Les références et journaux permettent de repérer l’origine de chaque mouvement.
            </Typography>
            <Divider />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800}>VE — Ventes</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Écriture de vente (facture émise) : <b>D 411</b> / <b>C 706</b> + <b>44571</b>.
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  Exemple référence : <code>VENTE FAC-2026-0001</code>
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800}>BQ — Banque</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Encaissement (paiement) : <b>D 512</b> / <b>C 411</b>.
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  Exemple référence : <code>PAIEMENT FAC-2026-0001#42</code>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Remboursement : <b>D 411</b> / <b>C 512</b> (inverse de l&apos;encaissement).
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  Exemple : <code>REMBOURSEMENT ACO-2026-0001#3</code>
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800}>OD — Opérations diverses</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Divers (ex: devis hors-bilan, achats, paie, URSSAF). À utiliser pour les écritures non “vente/paiement”.
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded sx={financeCardSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={800}>Comptes PCG utiles (ce que vous voyez le plus souvent)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {filteredAccounts.length === 0 ? (
            <Alert severity="info">Aucun compte ne correspond à votre recherche.</Alert>
          ) : (
            <TableContainer>
              <Table size="small" sx={financeTableSx}>
                <TableHead sx={financeTableHeadSx}>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell>Rôle</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAccounts.map((a) => (
                    <TableRow key={a.code} hover>
                      <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{a.code}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>
                        {a.hint ? (
                          <Chip
                            label={a.hint}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              fontWeight: 700,
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {a.type}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Astuce : si un compte apparaît en mouvement mais pas ici, il suffit de le créer (ou de déclencher une opération)
            et Facturio l’ajoute au plan comptable.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={financeCardSx}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography fontWeight={800}>Glossaire (sigles & termes)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {filteredGlossary.length === 0 ? (
            <Alert severity="info">Aucun terme ne correspond à votre recherche.</Alert>
          ) : (
            <Stack spacing={1.5}>
              {filteredGlossary.map((g) => (
                <Box key={g.key}>
                  <Typography fontWeight={900}>{g.label}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {g.description}
                  </Typography>
                  {g.examples?.length ? (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Exemple : {g.examples.join(' · ')}
                    </Typography>
                  ) : null}
                </Box>
              ))}
            </Stack>
          )}
        </AccordionDetails>
      </Accordion>
    </Stack>
  )
}

function unwrapList<T>(response: unknown, keys: Array<'items' | 'accounts'>): T[] {
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
      {value === index && <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  )
}

function KpiCard({
  label,
  value,
  gradient,
}: {
  label: string
  value: string
  gradient: string
}) {
  return (
    <Card
      sx={{
        ...financeCardSx,
        background: gradient,
        color: '#fff',
      }}
    >
      <CardContent>
        <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: '0.1em' }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  )
}

const defaultStart = () => new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
const defaultEnd = () => new Date().toISOString().split('T')[0]

export function AccountingPage() {
  const theme = useTheme()
  const [tabValue, setTabValue] = useState(0)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [movements, setMovements] = useState<AccountingMovement[]>([])
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRow[]>([])
  const [generalLedger, setGeneralLedger] = useState<FlatLedgerRow[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [selectedAccount, setSelectedAccount] = useState<string>('')
  const [movementKindFilter, setMovementKindFilter] = useState<MovementKind | 'all'>('all')

  const invalidateCache = useCallback(() => {
    accountingService.getAccounts()
  }, [])

  const loadSummary = useCallback(async () => {
    try {
      const response = await accountingService.getSummary(startDate, endDate)
      setSummary(unwrapApiPayload<FinanceSummary>(response))
    } catch {
      setSummary(null)
    }
  }, [startDate, endDate])

  const loadAccounts = useCallback(async () => {
    try {
      const response = await accountingService.getAccounts()
      setAccounts(unwrapList<Account>(response, ['accounts', 'items']))
    } catch (err: unknown) {
      setError(errorMessage(err, 'Erreur lors du chargement des comptes'))
    }
  }, [])

  const loadMovements = useCallback(async () => {
    try {
      setLoading(true)
      const response = await accountingService.getMovements(startDate, endDate)
      setMovements(unwrapApiPayload<AccountingMovement[]>(response) ?? [])
    } catch (err: unknown) {
      setError(errorMessage(err, 'Erreur lors du chargement des mouvements'))
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  const loadTrialBalance = useCallback(async () => {
    try {
      setLoading(true)
      const response = await accountingService.getTrialBalance(startDate, endDate)
      setTrialBalance(unwrapApiPayload<TrialBalanceRow[]>(response) ?? [])
    } catch (err: unknown) {
      setError(errorMessage(err, 'Erreur lors du chargement de la balance'))
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  const loadGeneralLedger = useCallback(async () => {
    try {
      setLoading(true)
      const response = await accountingService.getGeneralLedger(
        startDate,
        endDate,
        selectedAccount || undefined
      )
      const groups = unwrapApiPayload(response) ?? []
      setGeneralLedger(flattenGeneralLedger(Array.isArray(groups) ? groups : []))
    } catch (err: unknown) {
      setError(errorMessage(err, 'Erreur lors du chargement du grand livre'))
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, selectedAccount])

  const refreshTab = useCallback(() => {
    void loadSummary()
    if (tabValue === 0) void loadMovements()
    else if (tabValue === 1) void loadTrialBalance()
    else if (tabValue === 2) void loadGeneralLedger()
  }, [tabValue, loadMovements, loadTrialBalance, loadGeneralLedger, loadSummary])

  useEffect(() => {
    void loadAccounts()
    connectFinanceRealtime()
    const unsub = subscribeFinanceRealtime((ev) => {
      if (
        ev.resource === 'invoices' &&
        (ev.action === 'paid' || ev.action === 'updated' || ev.action === 'created' || ev.action === 'sent')
      ) {
        refreshTab()
      }
    })
    return unsub
  }, [loadAccounts, refreshTab])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await accountingService.syncFromInvoices()
        if (!cancelled) refreshTab()
      } catch {
        /* seed / journaux manquants en dev */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    refreshTab()
  }, [tabValue, startDate, endDate, selectedAccount, refreshTab])

  const handleSync = async () => {
    try {
      setSyncing(true)
      setSyncMessage(null)
      const response = await accountingService.syncFromInvoices()
      const result = unwrapApiPayload<{
        salesCreated: number
        paymentsCreated: number
        refundsCreated?: number
        errors: unknown[]
      }>(response)
      if (result) {
        const parts = [
          result.salesCreated > 0 ? `${result.salesCreated} vente(s)` : null,
          result.paymentsCreated > 0 ? `${result.paymentsCreated} encaissement(s)` : null,
          result.refundsCreated && result.refundsCreated > 0
            ? `${result.refundsCreated} remboursement(s)`
            : null,
        ].filter(Boolean)
        setSyncMessage(
          parts.length
            ? `Synchronisation : ${parts.join(', ')} créé(s).`
            : 'Comptabilité déjà à jour pour vos factures.'
        )
        if (result.errors.length) {
          setError(`${result.errors.length} écriture(s) en erreur (voir console).`)
          console.warn('[compta sync]', result.errors)
        }
      }
      invalidateCache()
      refreshTab()
    } catch (err: unknown) {
      setError(errorMessage(err, 'Erreur lors de la synchronisation'))
    } finally {
      setSyncing(false)
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
      setError(errorMessage(err, "Erreur lors de l'export FEC"))
    }
  }

  const safeAccounts = Array.isArray(accounts) ? accounts : []

  const journalChipColor = (code: string): 'primary' | 'success' | 'default' => {
    if (code === 'VE') return 'primary'
    if (code === 'BQ') return 'success'
    return 'default'
  }

  const showDateFilters = tabValue !== 6
  const filteredMovements = filterMovementsByKind(movements, movementKindFilter)

  return (
    <Box sx={{ p: financePagePadding }}>
      <PageHeader
        title="Comptabilité"
        subtitle="Ventes (VE), encaissements et remboursements (BQ), avoirs — PCG 411, 706, 44571, 512"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={syncing ? <CircularProgress size={18} color="inherit" /> : <Sync />}
              onClick={handleSync}
              disabled={syncing}
              sx={financeOutlinedButtonSx}
            >
              Synchroniser factures
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleExportFEC}
              sx={financePrimaryButtonSx}
            >
              Exporter FEC
            </Button>
          </Stack>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {syncMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSyncMessage(null)}>
          {syncMessage}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'CA HT (factures payées)', value: formatCurrency(summary?.revenueHt ?? 0), gradient: financeKpiGradients.revenue },
          { label: 'TVA collectée', value: formatCurrency(summary?.vatCollected ?? 0), gradient: financeKpiGradients.conversion },
          { label: 'Encaissements TTC', value: formatCurrency(summary?.totalTtc ?? 0), gradient: financeKpiGradients.clients },
          { label: 'Remboursements', value: formatCurrency(summary?.refundsTotal ?? 0), gradient: financeKpiGradients.unpaid },
          {
            label: 'Trésorerie nette',
            value: formatCurrency(summary?.netCashCollected ?? summary?.totalTtc ?? 0),
            gradient: financeKpiGradients.revenue,
          },
        ].map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 12, sm: 6, md: 2.4 }}>
            <KpiCard label={kpi.label} value={kpi.value} gradient={kpi.gradient} />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3, ...financeCardSx }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
            {showDateFilters && (
              <>
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
              </>
            )}
            {tabValue === 2 && (
              <FormControl fullWidth sx={{ minWidth: { sm: 200 }, flex: { sm: '1 1 200px' } }}>
                <InputLabel>Compte</InputLabel>
                <Select
                  value={selectedAccount}
                  label="Compte"
                  onChange={(e) => setSelectedAccount(e.target.value)}
                >
                  <MenuItem value="">Tous les comptes</MenuItem>
                  {safeAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.code}>
                      {account.code} — {account.name}
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
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<ReceiptLong />} label="Mouvements" />
            <Tab icon={<Assessment />} label="Balance" />
            <Tab icon={<Book />} label="Grand livre" />
            <Tab icon={<MoneyOff />} label="Remboursements" />
            <Tab icon={<CreditScore />} label="Avoirs" />
            <Tab icon={<Savings />} label="Acomptes" />
            <Tab icon={<School />} label="Guide compta" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
            {(['all', 'sale', 'payment', 'refund', 'credit_note'] as const).map((k) => (
              <Chip
                key={k}
                label={k === 'all' ? 'Tous' : movementKindLabel(k)}
                onClick={() => setMovementKindFilter(k)}
                color={movementKindFilter === k ? 'primary' : 'default'}
                variant={movementKindFilter === k ? 'filled' : 'outlined'}
              />
            ))}
          </Stack>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredMovements.length === 0 ? (
            <Alert severity="info">
              Aucun mouvement sur la période. Cliquez sur « Synchroniser factures » pour générer les
              écritures à partir de vos factures émises, payées et remboursées.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small" sx={financeTableSx}>
                <TableHead sx={financeTableHeadSx}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Journal</TableCell>
                    <TableCell>Compte</TableCell>
                    <TableCell>Libellé</TableCell>
                    <TableCell>Référence</TableCell>
                    <TableCell align="right">Débit</TableCell>
                    <TableCell align="right">Crédit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMovements.map((m) => (
                    <TableRow key={m.lineId} hover>
                      <TableCell>{formatDate(m.date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={movementKindLabel(m.movementKind)}
                          size="small"
                          color={movementKindColor(m.movementKind)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={m.journalCode}
                          size="small"
                          color={journalChipColor(m.journalCode)}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} component="span">
                          {m.accountCode}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {ACCOUNT_CODE_HINTS[m.accountCode] ?? m.accountName}
                        </Typography>
                      </TableCell>
                      <TableCell>{m.description ?? m.memo ?? '—'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {m.reference ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {m.debit > 0 ? formatCurrency(m.debit) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        {m.credit > 0 ? formatCurrency(m.credit) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 2, display: 'block', px: 1 }}
          >
            VE : vente — BQ encaissement D 512 / C 411 — BQ remboursement D 411 / C 512 — Avoir : AVO-… en VE
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <b>Balance des comptes</b> : résumé technique des mouvements sur la période sélectionnée
              (<code>{startDate}</code> → <code>{endDate}</code>). Les comptes sont agrégés par total débit/crédit.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              En comptabilité française, l’obligation porte surtout sur la tenue d’une comptabilité chronologique,
              le contrôle par inventaire au moins une fois tous les 12 mois, et la production des <b>comptes annuels</b> à la
              clôture de l’exercice (bilan, compte de résultat, annexe). <b>Il n’y a pas</b> de principe “mensuel” imposé
              pour une balance : les arrêtés intermédiaires peuvent exister pour le pilotage, mais l’app calcule ici la balance
              sur l’intervalle que vous sélectionnez.
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : trialBalance.length === 0 ? (
            <Alert severity="info">Aucune donnée pour la période sélectionnée</Alert>
          ) : (
            <TableContainer>
              <Table size="small" sx={financeTableSx}>
                <TableHead sx={financeTableHeadSx}>
                  <TableRow>
                    <TableCell>Compte</TableCell>
                    <TableCell>Nom</TableCell>
                    <TableCell align="right">Débit</TableCell>
                    <TableCell align="right">Crédit</TableCell>
                    <TableCell align="right">Solde</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trialBalance.map((item) => (
                    <TableRow key={item.accountCode} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{item.accountCode}</TableCell>
                      <TableCell>{item.accountName}</TableCell>
                      <TableCell align="right">{formatCurrency(item.debit)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.credit)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        {formatCurrency(item.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <b>Grand livre</b> : liste détaillée des écritures par compte, sur la période sélectionnée
              (<code>{startDate}</code> → <code>{endDate}</code>). Le “solde” affiché est le cumul (débit − crédit) au fil des lignes.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Le grand livre et le livre-journal font partie des documents de tenue de la comptabilité. La réglementation impose
              notamment la production des <b>comptes annuels</b> à la clôture de l’exercice (et un inventaire au moins une fois tous les 12 mois),
              mais la périodicité d’affichage (mois/année) dépend de <b>l’intervalle</b> que vous choisissez. Ici, le grand livre est “par mois”
              ou “par ans” uniquement via le filtre de dates.
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : generalLedger.length === 0 ? (
            <Alert severity="info">Aucune écriture pour la période sélectionnée</Alert>
          ) : (
            <TableContainer>
              <Table size="small" sx={financeTableSx}>
                <TableHead sx={financeTableHeadSx}>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Compte</TableCell>
                    <TableCell>Journal</TableCell>
                    <TableCell>Référence</TableCell>
                    <TableCell>Libellé</TableCell>
                    <TableCell align="right">Débit</TableCell>
                    <TableCell align="right">Crédit</TableCell>
                    <TableCell align="right">Solde</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generalLedger.map((entry, index) => (
                    <TableRow key={`${entry.accountCode}-${index}`} hover>
                      <TableCell>{formatDate(entry.date)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {entry.accountCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{entry.journal}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {entry.reference || '—'}
                      </TableCell>
                      <TableCell>{entry.description || '—'}</TableCell>
                      <TableCell align="right">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                      </TableCell>
                      <TableCell align="right">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                      </TableCell>
                      <TableCell align="right">{formatCurrency(entry.balance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <RefundsPanel startDate={startDate} endDate={endDate} />
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <AvoirsPanel />
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <DepositsPanel />
        </TabPanel>

        <TabPanel value={tabValue} index={6}>
          <AccountingGuide accounts={safeAccounts} />
        </TabPanel>
      </Card>
    </Box>
  )
}
