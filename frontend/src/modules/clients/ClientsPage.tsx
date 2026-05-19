import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Stack,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  Email,
  Phone,
  FilterList,
  Upload,
  Download
} from '@mui/icons-material'
import {
  clientService,
  mapApiClientToClient,
  parseClientsListResponse,
  toCreateClientPayload,
  unwrapApiPayload,
} from '../../services/clients'
import type { Client } from '../../services/clients'
import { PageHeader } from '../../components/finance/PageHeader'
import { financeCardSx, financePagePadding, financePrimaryButtonSx } from '../../components/finance/financeStyles'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import {
  ClientFormDialog,
  clientToFormValues,
  emptyClientFormValues,
  type ClientFormValues,
} from './components/ClientFormDialog'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'

export function ClientsPage() {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [formDialogMode, setFormDialogMode] = useState<'create' | 'edit' | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [clientForm, setClientForm] = useState<ClientFormValues>(emptyClientFormValues)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
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

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await clientService.getClients({ page: 1, limit: 100 })
        setClients(parseClientsListResponse(response))
      } catch (err) {
        setError('Erreur lors du chargement des clients')
        console.error('Clients error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleExportClients = async () => {
    try {
      const blob = await clientService.exportClients({
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as any : undefined
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export')
    }
  }

  const resetClientForm = () => {
    setClientForm(emptyClientFormValues)
    setFormError(null)
  }

  const validateClientForm = (): boolean => {
    const name = clientForm.name.trim()
    const email = clientForm.email.trim()
    if (!name) {
      setFormError('Le nom du client est obligatoire')
      return false
    }
    if (!email) {
      setFormError("L'email est obligatoire")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Email invalide')
      return false
    }
    return true
  }

  const handleOpenCreateDialog = () => {
    resetClientForm()
    setFormDialogMode('create')
  }

  const handleOpenEditDialog = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    if (!client) return
    setClientForm(clientToFormValues(client))
    setFormError(null)
    setSelectedClientId(clientId)
    setFormDialogMode('edit')
  }

  const handleSaveClient = async () => {
    if (!validateClientForm()) return

    const name = clientForm.name.trim()
    const email = clientForm.email.trim()

    try {
      setSaving(true)
      setFormError(null)

      if (formDialogMode === 'create') {
        const payload = toCreateClientPayload({
          name,
          email,
          phone: clientForm.phone,
          address: clientForm.address,
          siren: clientForm.siren,
          isCompany: true,
          companyName: name,
        })
        const response = await clientService.createClient(payload as never)
        const created = mapApiClientToClient(
          unwrapApiPayload<Record<string, unknown>>(response),
          clientForm.status
        )
        setClients(prev => [created, ...prev])
      } else if (formDialogMode === 'edit' && selectedClientId) {
        const response = await clientService.updateClient({
          id: selectedClientId,
          name,
          email,
          siren: clientForm.siren || undefined,
          address: clientForm.address ? { street: clientForm.address, city: '', postalCode: '', country: 'FR' } : undefined,
          status: clientForm.status,
        })
        if (response.data) {
          setClients(prev =>
            prev.map(c => (c.id === selectedClientId ? { ...response.data!, phone: clientForm.phone || c.phone } : c))
          )
        }
      }

      setFormDialogMode(null)
      resetClientForm()
      setSelectedClientId(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Enregistrement impossible'
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!selectedClientId) return
    try {
      setDeleting(true)
      await clientService.deleteClient(selectedClientId)
      setClients(prev => prev.filter(c => c.id !== selectedClientId))
      setDeleteDialogOpen(false)
      setSelectedClientId(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Suppression impossible')
    } finally {
      setDeleting(false)
    }
  }

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null

  const handleImportClients = async () => {
    if (!importFile) return
    
    try {
      setError(null)
      const importResponse = await clientService.importClients(importFile, (progress) => {
        setImportProgress(progress)
      })
      
      if (importResponse.data) {
        alert(`Import réussi: ${importResponse.data.imported} client(s) importé(s)${importResponse.data.errors.length > 0 ? `, ${importResponse.data.errors.length} erreur(s)` : ''}`)
        setImportDialogOpen(false)
        setImportFile(null)
        setImportProgress(0)
        // Recharger la liste
        const listResponse = await clientService.getClients({ page: 1, limit: 100 })
        setClients(parseClientsListResponse(listResponse))
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'import')
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: financePagePadding }}>
        <TablePageSkeleton />
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
    <Box sx={{ p: financePagePadding }}>
      <PageHeader
        title="Clients"
        subtitle="Carnet clients, contacts et historique commercial"
        actions={
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<Upload />}
              onClick={() => setImportDialogOpen(true)}
              sx={{ minWidth: { xs: '100%', sm: 'auto' }, textTransform: 'none', fontWeight: 600 }}
            >
              Importer CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportClients}
              sx={{ minWidth: { xs: '100%', sm: 'auto' }, textTransform: 'none', fontWeight: 600 }}
            >
              Exporter CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenCreateDialog}
              sx={{ minWidth: { xs: '100%', sm: 'auto' }, ...financePrimaryButtonSx }}
            >
              Nouveau client
            </Button>
          </Stack>
        }
      />

      <Card sx={{ mb: 3, ...financeCardSx }}>
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
              placeholder="Rechercher un client..."
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
                <MenuItem value="active">Actifs</MenuItem>
                <MenuItem value="inactive">Inactifs</MenuItem>
                <MenuItem value="prospect">Prospects</MenuItem>
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

      {/* Tableau des clients */}
      <Card sx={financeCardSx}>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Client</TableCell>
                  {!isMobile && <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Contact</TableCell>}
                  <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Statut</TableCell>
                  {!isMobile && <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>CA Total</TableCell>}
                  {!isTablet && <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Dernière facture</TableCell>}
                  <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ 
                          width: { xs: 32, sm: 40 }, 
                          height: { xs: 32, sm: 40 }, 
                          mr: { xs: 1, sm: 2 }, 
                          bgcolor: 'primary.main' 
                        }}>
                          {client.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {client.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                            {client.address ? `${client.address.street}, ${client.address.city}` : 'Non renseignée'}
                          </Typography>
                          {isMobile && (
                            <Stack spacing={0.5} sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Email sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                  {client.email}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Phone sx={{ fontSize: 12, mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                  {client.phone}
                                </Typography>
                              </Box>
                            </Stack>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    {!isMobile && (
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {client.email}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              {client.phone}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                    )}
                    <TableCell>
                      <Chip
                        label={getStatusLabel(client.status)}
                        color={getStatusColor(client.status) as any}
                        size={isMobile ? "small" : "medium"}
                        sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                      />
                    </TableCell>
                    {!isMobile && (
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {formatCurrency(0)}
                        </Typography>
                      </TableCell>
                    )}
                    {!isTablet && (
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          Aucune
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <IconButton
                        size={isMobile ? "small" : "medium"}
                        onClick={(e) => {
                          setSelectedClientId(client.id)
                          handleMenuClick(e)
                        }}
                      >
                        <MoreVert fontSize={isMobile ? "small" : "medium"} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Menu contextuel */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose()
            if (selectedClientId) navigate(`/clients/${selectedClientId}`)
          }}
        >
          <Visibility sx={{ mr: 1 }} />
          Voir détails
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose()
            if (selectedClientId) handleOpenEditDialog(selectedClientId)
          }}
        >
          <Edit sx={{ mr: 1 }} />
          Modifier
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose()
            if (selectedClient?.email) {
              window.location.href = `mailto:${encodeURIComponent(selectedClient.email)}`
            }
          }}
          disabled={!selectedClient?.email}
        >
          <Email sx={{ mr: 1 }} />
          Envoyer email
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose()
            setDeleteDialogOpen(true)
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete sx={{ mr: 1 }} />
          Supprimer
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={deleteDialogOpen}
        severity="error"
        title="Supprimer le client"
        message={`Supprimer « ${selectedClient?.name ?? 'ce client'} » ?`}
        onConfirm={handleDeleteClient}
        onClose={() => {
          if (!deleting) {
            setDeleteDialogOpen(false)
            setSelectedClientId(null)
          }
        }}
        loading={deleting}
      />

      {/* Dialog import CSV */}
      <Dialog 
        open={importDialogOpen} 
        onClose={() => {
          setImportDialogOpen(false)
          setImportFile(null)
          setImportProgress(0)
        }} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Importer des clients depuis CSV</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Le fichier CSV doit contenir les colonnes: name, email, phone, address (optionnel)
            </Alert>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<Upload />}
            >
              {importFile ? importFile.name : 'Sélectionner un fichier CSV'}
              <input
                type="file"
                hidden
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setImportFile(file)
                }}
              />
            </Button>
            {importProgress > 0 && importProgress < 100 && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Import en cours: {importProgress}%
                </Typography>
                <CircularProgress variant="determinate" value={importProgress} />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setImportDialogOpen(false)
            setImportFile(null)
            setImportProgress(0)
          }}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleImportClients}
            disabled={!importFile || importProgress > 0}
          >
            Importer
          </Button>
        </DialogActions>
      </Dialog>

      <ClientFormDialog
        open={formDialogMode !== null}
        mode={formDialogMode === 'edit' ? 'edit' : 'create'}
        values={clientForm}
        error={formError}
        saving={saving}
        onClose={() => {
          if (saving) return
          setFormDialogMode(null)
          resetClientForm()
          setSelectedClientId(null)
        }}
        onChange={setClientForm}
        onSubmit={handleSaveClient}
        onClearError={() => setFormError(null)}
      />
    </Box>
  )
}


