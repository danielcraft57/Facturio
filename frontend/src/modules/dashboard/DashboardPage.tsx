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
  useTheme,
  useMediaQuery
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
import { DEMO_STATS, DEMO_INVOICES, DEMO_CLIENTS } from '../../data/demo'

export function DashboardPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

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
                  {formatCurrency(DEMO_STATS.totalRevenue)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    +{DEMO_STATS.monthlyGrowth}% ce mois
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
                  Factures en attente
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                  {formatCurrency(DEMO_STATS.pendingInvoices)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {DEMO_INVOICES.filter(inv => inv.status === 'sent').length} factures
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
                  {DEMO_STATS.activeClients}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  sur {DEMO_STATS.totalClients} clients
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
                  {DEMO_STATS.conversionRate}%
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  devis → factures
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: { xs: 32, sm: 48 }, opacity: 0.3 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Tableaux de données */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          md: 'repeat(2, 1fr)' 
        }, 
        gap: { xs: 2, sm: 3 } 
      }}>
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Dernières factures
              </Typography>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Box>
            <TableContainer sx={{ maxHeight: 400 }}>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Numéro</TableCell>
                    {!isMobile && <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Client</TableCell>}
                    <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Montant</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Statut</TableCell>
                    {!isMobile && <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {DEMO_INVOICES.slice(0, isMobile ? 3 : 4).map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {invoice.number}
                        </Typography>
                        {isMobile && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {invoice.clientName}
                          </Typography>
                        )}
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {invoice.clientName}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {formatCurrency(invoice.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(invoice.status)}
                          color={getStatusColor(invoice.status) as any}
                          size={isMobile ? "small" : "medium"}
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      </TableCell>
                      {!isMobile && (
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Voir">
                              <IconButton size="small">
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Modifier">
                              <IconButton size="small">
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Top clients
              </Typography>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Box>
            <Stack spacing={isMobile ? 1 : 2}>
              {DEMO_CLIENTS.slice(0, isMobile ? 3 : 4).map((client) => (
                <Box key={client.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, mr: { xs: 1, sm: 2 }, bgcolor: 'primary.main' }}>
                      {client.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {client.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                        {formatCurrency(client.totalRevenue)}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={client.status === 'active' ? 'Actif' : client.status === 'prospect' ? 'Prospect' : 'Inactif'}
                    color={client.status === 'active' ? 'success' : client.status === 'prospect' ? 'warning' : 'default'}
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}


