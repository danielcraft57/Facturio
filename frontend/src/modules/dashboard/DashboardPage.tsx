import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Avatar,
  Stack,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  TrendingUp,
  AttachMoney,
  People,
  Receipt,
  MoreVert,
  Visibility,
  Edit
} from '@mui/icons-material'
import { useEffect } from 'react'
import { useDashboard, useClients, useInvoices } from '../../hooks/useStores'

export function DashboardPage() {
  const dashboardStore = useDashboard()
  const clientsStore = useClients()
  const invoicesStore = useInvoices()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Charger les données en parallèle
        await Promise.all([
          dashboardStore.fetchStats(),
          clientsStore.fetchClients({ page: 1, limit: 5 }),
          invoicesStore.fetchInvoices({ page: 1, limit: 5 })
        ])
      } catch (err) {
        console.error('Dashboard error:', err)
      }
    }

    fetchDashboardData()
  }, [])

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
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Payée'
      case 'sent': return 'Envoyée'
      case 'overdue': return 'En retard'
      case 'draft': return 'Brouillon'
      default: return status
    }
  }

  if (dashboardStore.isLoading) {
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

  if (!dashboardStore.stats) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Alert severity="warning">
          Aucune donnée disponible
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
        Tableau de bord
      </Typography>

      {/* Statistiques principales */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(4, 1fr)' 
        }, 
        gap: { xs: 2, sm: 3 }, 
        mb: 4 
      }}>
        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent sx={{ color: 'white', p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ opacity: 0.8, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Chiffre d'affaires
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                  {formatCurrency(dashboardStore.stats.revenue.total)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    +{dashboardStore.stats.revenue.growth}% ce mois
                  </Typography>
                </Box>
              </Box>
              <AttachMoney sx={{ fontSize: { xs: 32, sm: 48 }, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <CardContent sx={{ color: 'white', p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ opacity: 0.8, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Factures impayées
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                  {formatCurrency(dashboardStore.stats.invoices.total - dashboardStore.stats.invoices.paid)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {dashboardStore.stats.invoices.overdue} en retard
                </Typography>
              </Box>
              <Receipt sx={{ fontSize: { xs: 32, sm: 48 }, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <CardContent sx={{ color: 'white', p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ opacity: 0.8, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Clients actifs
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                  {dashboardStore.stats.clients.active}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  +{dashboardStore.stats.clients.newThisMonth} ce mois
                </Typography>
              </Box>
              <People sx={{ fontSize: { xs: 32, sm: 48 }, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <CardContent sx={{ color: 'white', p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ opacity: 0.8, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  Taux de conversion
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                  {Math.round((dashboardStore.stats.invoices.paid / dashboardStore.stats.invoices.total) * 100)}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Devis → Factures
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: { xs: 32, sm: 48 }, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Contenu principal */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          lg: '2fr 1fr' 
        }, 
        gap: { xs: 3, lg: 4 } 
      }}>
        {/* Factures récentes */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Factures récentes
              </Typography>
              <Chip 
                label={`${invoicesStore.invoices.length} factures`} 
                size="small" 
                color="primary" 
                variant="outlined"
              />
            </Box>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>N° Facture</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Client</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Montant</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Statut</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoicesStore.invoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {invoice.number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              width: { xs: 24, sm: 32 }, 
                              height: { xs: 24, sm: 32 }, 
                              mr: 1,
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
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
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {formatCurrency(invoice.total)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(invoice.status)} 
                          color={getStatusColor(invoice.status) as any}
                          size="small"
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Voir">
                            <IconButton size="small" sx={{ p: 0.5 }}>
                              <Visibility sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Éditer">
                            <IconButton size="small" sx={{ p: 0.5 }}>
                              <Edit sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Clients récents */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Clients récents
              </Typography>
              <Chip 
                label={`${clientsStore.clients.length} clients`} 
                size="small" 
                color="secondary" 
                variant="outlined"
              />
            </Box>
            
            <Stack spacing={2}>
              {clientsStore.clients.map((client) => (
                <Box key={client.id} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 1.5, 
                  borderRadius: 1, 
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}>
                  <Avatar 
                    sx={{ 
                      width: { xs: 32, sm: 40 }, 
                      height: { xs: 32, sm: 40 }, 
                      mr: 2,
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {client.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {client.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                      {client.email}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Chip 
                        label={client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'Prospect'} 
                        size="small"
                        color={client.status === 'active' ? 'success' : client.status === 'inactive' ? 'default' : 'warning'}
                        variant="outlined"
                        sx={{ fontSize: '0.625rem' }}
                      />
                    </Box>
                  </Box>
                  <IconButton size="small" sx={{ p: 0.5 }}>
                    <MoreVert sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}


