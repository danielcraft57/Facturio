import { useState, useEffect } from 'react'
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
  Paper,
  Avatar,
  useTheme,
  useMediaQuery,
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
  AttachMoney,
  Note
} from '@mui/icons-material'
import { clientService, type Client } from '../../services/clients'
import {
  ClientFormDialog,
  clientToFormValues,
  emptyClientFormValues,
  type ClientFormValues,
} from './components/ClientFormDialog'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'
import { invoiceService, type Invoice } from '../../services/invoices'
import { quoteService } from '../../services/quoteService'
import type { Quote } from '../../types/quote'
import { formatCurrency, formatDate } from '../../utils/formatters'

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
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
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

  useEffect(() => {
    if (id) {
      loadClient()
      loadInvoices()
      loadQuotes()
    }
  }, [id])

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
      if (response.data?.invoices) {
        setInvoices(response.data.invoices)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des factures:', err)
    }
  }

  const loadQuotes = async () => {
    if (!id) return
    
    try {
      const response = await quoteService.getQuotes({ clientId: Number(id) }, 1, 100)
      if (response.data?.data) {
        setQuotes(response.data.data)
      }
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

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0)

  const pendingAmount = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0)

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
          onClick={() => navigate('/clients')}
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
          onClick={() => navigate('/clients')}
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
          variant="contained"
          startIcon={<Receipt />}
          onClick={() => navigate(`/factures/inbox?create=1&clientId=${id}`)}
        >
          Nouvelle facture
        </Button>
      </Stack>

      <GridLegacy container spacing={3}>
        {/* Colonne principale */}
        <GridLegacy item xs={12} md={8}>
          {/* Informations client */}
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

          {/* Onglets */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                <Tab label={`Factures (${invoices.length})`} />
                <Tab label={`Devis (${quotes.length})`} />
                <Tab label="Notes" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
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
                              onClick={() => navigate(`/factures/${invoice.id}`)}
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

            <TabPanel value={tabValue} index={1}>
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
                              onClick={() => navigate(`/devis/inbox?quoteId=${quote.id}`)}
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
              <Alert severity="info">
                Les notes seront disponibles prochainement
              </Alert>
            </TabPanel>
          </Card>
        </GridLegacy>

        {/* Panneau latéral */}
        <GridLegacy item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Statistiques */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statistiques
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Chiffre d'affaires total
                    </Typography>
                    <Typography variant="h5" color="success.main">
                      {formatCurrency(totalRevenue)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      En attente de paiement
                    </Typography>
                    <Typography variant="h6" color="warning.main">
                      {formatCurrency(pendingAmount)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Nombre de factures
                    </Typography>
                    <Typography variant="body1">
                      {invoices.length}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Nombre de devis
                    </Typography>
                    <Typography variant="body1">
                      {quotes.length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions rapides
                </Typography>
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Receipt />}
                    onClick={() => navigate(`/factures/inbox?create=1&clientId=${id}`)}
                  >
                    Créer une facture
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Description />}
                    onClick={() => navigate(`/devis/inbox?create=1&clientId=${id}`)}
                  >
                    Créer un devis
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Email />}
                    onClick={() => window.location.href = `mailto:${client.email}`}
                  >
                    Envoyer un email
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </GridLegacy>
      </GridLegacy>

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

