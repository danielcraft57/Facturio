import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  GridLegacy,
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  Email,
  Phone,
  LocationOn,
  Business,
  Receipt,
  Description,
} from '@mui/icons-material'
import { clientService, type Client } from '../../services/clients'
import {
  ClientFormDialog,
  clientToFormValues,
  emptyClientFormValues,
  type ClientFormValues,
} from './components/ClientFormDialog'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'
import { invoiceService, parseInvoicesListResponse, type Invoice } from '../../services/invoices'
import { parseQuotesListPage, quoteService } from '../../services/quoteService'
import { clientFinanceService, type ClientFinanceData } from '../../services/clientFinance'
import type { Quote } from '../../types/quote'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { isClientDetailRouteSegment } from '../../types/clientFolders'
import {
  openCreateInvoiceForClient,
  openCreateQuoteForClient,
} from '../../utils/openDocumentView'
import { ClientFinancePanel } from './components/ClientFinancePanel'
import { ClientDetailKpiStrip } from './components/ClientDetailKpiStrip'

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

export function ClientDetailPage() {
  const { folder } = useParams<{ folder: string }>()
  const id = isClientDetailRouteSegment(folder) ? folder : undefined
  const navigate = useNavigate()

  const [client, setClient] = useState<Client | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<ClientFormValues>(emptyClientFormValues)
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [finance, setFinance] = useState<ClientFinanceData | null>(null)
  const [financeLoading, setFinanceLoading] = useState(true)
  const [financeError, setFinanceError] = useState<string | null>(null)

  const loadFinance = useCallback(async () => {
    if (!id) return
    try {
      setFinanceLoading(true)
      setFinanceError(null)
      const data = await clientFinanceService.getFinance(id)
      setFinance(data)
    } catch (err: unknown) {
      setFinanceError(err instanceof Error ? err.message : 'Synthèse finance indisponible')
      setFinance(null)
    } finally {
      setFinanceLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('Identifiant client invalide')
      return
    }
    void loadClient()
    void loadInvoices()
    void loadQuotes()
    void loadFinance()
  }, [id, loadFinance])

  const loadClient = async () => {
    if (!id) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await clientService.getClient(id)
      if (response.data) {
        setClient(response.data)
        setEditForm(clientToFormValues(response.data))
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du client')
      console.error('Client error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInvoices = async () => {
    if (!id) return
    
    try {
      const response = await invoiceService.getInvoices({ clientId: id, limit: 100 })
      setInvoices(parseInvoicesListResponse(response))
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err)
    }
  }

  const loadQuotes = async () => {
    if (!id) return
    
    try {
      const response = await quoteService.getQuotes({ clientId: id }, 1, 100)
      setQuotes(parseQuotesListPage(response).quotes)
    } catch (err) {
      console.error('Erreur lors du chargement des devis:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'default'
      case 'prospect': return 'warning'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'inactive': return 'Inactif'
      case 'prospect': return 'Prospect'
      default: return status
    }
  }

  const invoiceTabCount = finance?.invoiceCount ?? invoices.length
  const quoteTabCount = finance?.quoteCount ?? quotes.length

  const handleSaveEdit = async () => {
    if (!id || !client) return
    const name = editForm.name.trim()
    const email = editForm.email.trim()
    if (!name || !email) {
      setEditError('Nom et email sont obligatoires')
      return
    }
    try {
      setSaving(true)
      setEditError(null)
      const response = await clientService.updateClient({
        id,
        name,
        email,
        siren: editForm.siren || undefined,
        address: editForm.address
          ? { street: editForm.address, city: '', postalCode: '', country: 'FR' }
          : undefined,
        status: editForm.status,
      })
      if (response.data) {
        setClient({ ...response.data, phone: editForm.phone || client.phone })
        setEditOpen(false)
      }
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Mise à jour impossible')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <TablePageSkeleton rows={6} />
      </Box>
    )
  }

  if (error || !client) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/clients/inbox')}
          sx={{ mb: 2 }}
        >
          Retour aux clients
        </Button>
        <Alert severity="error">
          {error || 'Client introuvable'}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* En-tête */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/clients/inbox')}
        >
          Retour
        </Button>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={() => {
            if (client) setEditForm(clientToFormValues(client))
            setEditError(null)
            setEditOpen(true)
          }}
        >
          Modifier
        </Button>
        {client.email && (
          <Button
            variant="outlined"
            startIcon={<Email />}
            href={`mailto:${encodeURIComponent(client.email)}`}
          >
            Email
          </Button>
        )}
        <Button
          variant="outlined"
          startIcon={<Description />}
          onClick={() => id && openCreateQuoteForClient(id)}
        >
          Nouveau devis
        </Button>
        <Button
          variant="contained"
          startIcon={<Receipt />}
          onClick={() => id && openCreateInvoiceForClient(id)}
        >
          Nouvelle facture
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '2rem' }}>
                  {client.name.charAt(0)}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h4" gutterBottom>
                    {client.name}
                  </Typography>
                  <Chip
                    label={getStatusLabel(client.status)}
                    color={getStatusColor(client.status) as any}
                    size="small"
                  />
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <GridLegacy container spacing={2}>
                {client.email && (
                  <GridLegacy item xs={12} sm={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Email color="action" />
                      <Typography variant="body2">{client.email}</Typography>
                    </Stack>
                  </GridLegacy>
                )}
                
                {client.phone && (
                  <GridLegacy item xs={12} sm={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Phone color="action" />
                      <Typography variant="body2">{client.phone}</Typography>
                    </Stack>
                  </GridLegacy>
                )}

                {client.siren && (
                  <GridLegacy item xs={12} sm={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Business color="action" />
                      <Typography variant="body2">SIREN {client.siren}</Typography>
                    </Stack>
                  </GridLegacy>
                )}
                
                {client.address && (
                  <GridLegacy item xs={12}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <LocationOn color="action" sx={{ mt: 0.5 }} />
                      <Box>
                        <Typography variant="body2">
                          {client.address.street}
                        </Typography>
                        <Typography variant="body2">
                          {client.address.postalCode} {client.address.city}
                        </Typography>
                        {client.address.country && (
                          <Typography variant="body2">
                            {client.address.country}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </GridLegacy>
                )}

                {client.company && (
                  <>
                    {client.company.tva && (
                      <GridLegacy item xs={12} sm={6}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Business color="action" />
                          <Typography variant="body2">
                            TVA: {client.company.tva}
                          </Typography>
                        </Stack>
                      </GridLegacy>
                    )}
                    {client.company.siret && (
                      <GridLegacy item xs={12} sm={6}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Business color="action" />
                          <Typography variant="body2">
                            SIRET: {client.company.siret}
                          </Typography>
                        </Stack>
                      </GridLegacy>
                    )}
                  </>
                )}
              </GridLegacy>
            </CardContent>
          </Card>

      {finance && !financeLoading && (
        <ClientDetailKpiStrip
          balances={finance.balances}
          invoiceCount={invoiceTabCount}
          quoteCount={quoteTabCount}
        />
      )}

      {financeError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {financeError}
        </Alert>
      )}

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1, sm: 2 } }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Synthèse finance" />
            <Tab label={`Factures (${invoiceTabCount})`} />
            <Tab label={`Devis (${quoteTabCount})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {financeLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}
          {!financeLoading && finance && id && (
            <ClientFinancePanel
              clientId={id}
              finance={finance}
              onReload={() => {
                void loadFinance()
              }}
              onRefreshInvoices={() => {
                void loadInvoices()
                void loadFinance()
              }}
            />
          )}
          {!financeLoading && !finance && (
            <Alert severity="info">Aucune donnée financière pour ce client.</Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
              {invoices.length === 0 ? (
                <Alert severity="info">Aucune facture pour ce client</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Numéro</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell align="right">Montant</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell>{invoice.number}</TableCell>
                          <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                          <TableCell>
                            <Chip
                              label={invoice.status === 'paid' ? 'Payée' : invoice.status === 'sent' ? 'Envoyée' : invoice.status}
                              color={invoice.status === 'paid' ? 'success' : invoice.status === 'sent' ? 'info' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(invoice.total)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => {
                                void import('../../utils/openDocumentView').then(({ openInvoiceView }) =>
                                  openInvoiceView(invoice.id),
                                )
                              }}
                            >
                              <Description />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              {quotes.length === 0 ? (
                <Alert severity="info">Aucun devis pour ce client</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Numéro</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell align="right">Montant</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {quotes.map((quote) => (
                        <TableRow key={quote.id} hover>
                          <TableCell>{quote.number}</TableCell>
                          <TableCell>{formatDate(quote.date)}</TableCell>
                          <TableCell>
                            <Chip
                              label={quote.status === 'ACCEPTED' ? 'Accepté' : quote.status === 'SENT' ? 'Envoyé' : quote.status}
                              color={quote.status === 'ACCEPTED' ? 'success' : quote.status === 'SENT' ? 'info' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{formatCurrency(quote.total)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => {
                                void import('../../utils/openDocumentView').then(({ openQuoteView }) =>
                                  openQuoteView(quote.id),
                                )
                              }}
                            >
                              <Description />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
        </TabPanel>
      </Card>

      <ClientFormDialog
        open={editOpen}
        mode="edit"
        values={editForm}
        error={editError}
        saving={saving}
        onClose={() => {
          if (saving) return
          setEditOpen(false)
          if (client) setEditForm(clientToFormValues(client))
        }}
        onChange={setEditForm}
        onSubmit={handleSaveEdit}
        onClearError={() => setEditError(null)}
      />
    </Box>
  )
}

