import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Stack,
  Avatar,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Visibility,
  Send,
  Download
} from '@mui/icons-material'
import { invoiceService } from '../../services/invoices'
import { CreateInvoiceDialog } from './components/CreateInvoiceDialog'
import type { Invoice } from '../../services/invoices'

export function InvoicesPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await invoiceService.getInvoices({ page: 1, limit: 100 })
      setInvoices(response.data?.invoices || [])
    } catch (err) {
      setError('Erreur lors du chargement des factures')
      console.error('Invoices error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success'
      case 'sent': return 'info'
      case 'overdue': return 'error'
      case 'draft': return 'warning'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Payée'
      case 'sent': return 'Envoyée'
      case 'overdue': return 'En retard'
      case 'draft': return 'Brouillon'
      case 'cancelled': return 'Annulée'
      default: return status
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateInvoice = async (data: any) => {
    try {
      console.log('Création de facture:', data)
      
      // Simulation de création
      const newInvoice: Invoice = {
        id: Math.random().toString(36).substr(2, 9),
        number: `FAC-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
        clientId: data.clientId,
        client: {
          id: data.clientId,
          name: invoices.find(inv => inv.clientId === data.clientId)?.client.name || 'Client inconnu',
          email: invoices.find(inv => inv.clientId === data.clientId)?.client.email || ''
        },
        status: 'draft',
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        items: data.items.map((item: any, index: number) => ({
          id: (index + 1).toString(),
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          total: item.quantity * item.unitPrice,
          totalWithTax: (item.quantity * item.unitPrice) * (1 + item.taxRate / 100)
        })),
        subtotal: data.items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0),
        taxTotal: data.items.reduce((sum: number, item: any) => sum + ((item.quantity * item.unitPrice) * item.taxRate / 100), 0),
        total: data.items.reduce((sum: number, item: any) => sum + ((item.quantity * item.unitPrice) * (1 + item.taxRate / 100)), 0),
        currency: data.currency,
        notes: data.notes,
        terms: data.terms,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      setInvoices(prev => [newInvoice, ...prev])
      setCreateDialogOpen(false)
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error)
    }
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        p: { xs: 1, sm: 2, md: 3 }
      }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* En-tête */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 3,
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Factures
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Nouvelle facture
        </Button>
      </Box>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: '1fr 1fr',
              md: '2fr 1fr 1fr' 
            }, 
            gap: { xs: 2, sm: 2, md: 2 }, 
            alignItems: 'center' 
          }}>
            <TextField
              fullWidth
              placeholder="Rechercher une facture..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Statut</InputLabel>
              <Select
                value={statusFilter}
                label="Statut"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="draft">Brouillons</MenuItem>
                <MenuItem value="sent">Envoyées</MenuItem>
                <MenuItem value="paid">Payées</MenuItem>
                <MenuItem value="overdue">En retard</MenuItem>
                <MenuItem value="cancelled">Annulées</MenuItem>
              </Select>
            </FormControl>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              Plus de filtres
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Tableau des factures */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>N° Facture</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Client</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Statut</TableCell>
                  {!isMobile && <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Montant</TableCell>}
                  {!isTablet && <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Échéance</TableCell>}
                  <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {invoice.number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                        {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ 
                          width: { xs: 24, sm: 32 }, 
                          height: { xs: 24, sm: 32 }, 
                          mr: { xs: 1, sm: 2 }, 
                          bgcolor: 'primary.main',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          {invoice.client.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {invoice.client.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                            {invoice.client.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusLabel(invoice.status)} 
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                        sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                      />
                    </TableCell>
                    {!isMobile && (
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {formatCurrency(invoice.total)}
                        </Typography>
                      </TableCell>
                    )}
                    {!isTablet && (
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <IconButton size="small" sx={{ p: 0.5 }} title="Voir">
                          <Visibility sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" sx={{ p: 0.5 }} title="Éditer">
                          <Edit sx={{ fontSize: 16 }} />
                        </IconButton>
                        {invoice.status === 'draft' && (
                          <IconButton size="small" sx={{ p: 0.5 }} title="Envoyer">
                            <Send sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                        <IconButton size="small" sx={{ p: 0.5 }} title="Télécharger">
                          <Download sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton size="small" sx={{ p: 0.5 }} title="Plus d'actions">
                          <MoreVert sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {filteredInvoices.length === 0 && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary'
            }}>
              <Typography variant="body1">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Aucune facture ne correspond aux critères de recherche'
                  : 'Aucune facture trouvée'
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de création */}
      <CreateInvoiceDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateInvoice}
      />
    </Box>
  )
}


