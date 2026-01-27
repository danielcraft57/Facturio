import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  GridLegacy,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Cancel,
  Refresh,
  TrendingUp
} from '@mui/icons-material'
import { subscriptionsService, type Plan, type Subscription } from '../../services/subscriptions'
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

export function SubscriptionsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mrr, setMrr] = useState(0)
  const [arr, setArr] = useState(0)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [savingSubscription, setSavingSubscription] = useState(false)
  const [planName, setPlanName] = useState('')
  const [planAmount, setPlanAmount] = useState<number | ''>('')
  const [planInterval, setPlanInterval] = useState<'MONTH' | 'YEAR'>('MONTH')
  const [planCurrency, setPlanCurrency] = useState('EUR')
  const [planTrialDays, setPlanTrialDays] = useState<number | ''>('')
  const [subscriptionClientId, setSubscriptionClientId] = useState<number | ''>('')
  const [subscriptionPlanId, setSubscriptionPlanId] = useState<number | ''>('')
  const [subscriptionQuantity, setSubscriptionQuantity] = useState<number | ''>(1)
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadPlans(), loadSubscriptions(), loadAnalytics()])
  }

  const loadPlans = async () => {
    try {
      setLoading(true)
      const response = await subscriptionsService.getPlans()
      if (response.data) {
        setPlans(response.data)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des plans')
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriptions = async () => {
    try {
      const response = await subscriptionsService.getSubscriptions()
      if (response.data) {
        setSubscriptions(response.data)
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des abonnements:', err)
    }
  }

  const loadAnalytics = async () => {
    try {
      const [mrrResponse, arrResponse] = await Promise.all([
        subscriptionsService.getMRR().catch(() => ({ data: 0 })),
        subscriptionsService.getARR().catch(() => ({ data: 0 }))
      ])
      setMrr(mrrResponse.data || 0)
      setArr(arrResponse.data || 0)
    } catch (err) {
      console.error('Erreur lors du chargement des analytics:', err)
    }
  }

  const resetPlanForm = () => {
    setPlanName('')
    setPlanAmount('')
    setPlanInterval('MONTH')
    setPlanCurrency('EUR')
    setPlanTrialDays('')
  }

  const resetSubscriptionForm = () => {
    setSubscriptionClientId('')
    setSubscriptionPlanId('')
    setSubscriptionQuantity(1)
    setSubscriptionStartDate('')
  }

  const handleCreatePlan = async () => {
    if (!planName || !planAmount) {
      setError('Le nom et le montant du plan sont obligatoires')
      return
    }
    try {
      setSavingPlan(true)
      setError(null)
      await subscriptionsService.createPlan({
        productId: 0,
        name: planName,
        amount: Number(planAmount),
        currency: planCurrency,
        interval: planInterval,
        trialDays: planTrialDays === '' ? null : Number(planTrialDays),
      })
      await loadPlans()
      setPlanDialogOpen(false)
      resetPlanForm()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du plan')
    } finally {
      setSavingPlan(false)
    }
  }

  const handleCreateSubscription = async () => {
    if (!subscriptionClientId || !subscriptionPlanId) {
      setError('Le client et le plan sont obligatoires pour un abonnement')
      return
    }
    try {
      setSavingSubscription(true)
      setError(null)
      await subscriptionsService.createSubscription({
        clientId: Number(subscriptionClientId),
        planId: Number(subscriptionPlanId),
        quantity: subscriptionQuantity === '' ? 1 : Number(subscriptionQuantity),
        startDate: subscriptionStartDate || undefined,
      })
      await loadSubscriptions()
      setSubscriptionDialogOpen(false)
      resetSubscriptionForm()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l’abonnement')
    } finally {
      setSavingSubscription(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'CANCELLED': return 'default'
      case 'PAST_DUE': return 'error'
      case 'TRIALING': return 'info'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Actif'
      case 'CANCELLED': return 'Annulé'
      case 'PAST_DUE': return 'En retard'
      case 'TRIALING': return 'Essai'
      default: return status
    }
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Abonnements
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setSubscriptionDialogOpen(true)}
        >
          Nouvel abonnement
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Analytics */}
      <GridLegacy container spacing={2} sx={{ mb: 3 }}>
        <GridLegacy item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {formatCurrency(mrr)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              MRR (Revenu récurrent mensuel)
            </Typography>
          </Paper>
        </GridLegacy>
        <GridLegacy item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {formatCurrency(arr)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ARR (Revenu récurrent annuel)
            </Typography>
          </Paper>
        </GridLegacy>
        <GridLegacy item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {subscriptions.filter(s => s.status === 'ACTIVE').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Abonnements actifs
            </Typography>
          </Paper>
        </GridLegacy>
        <GridLegacy item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">
              {plans.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Plans disponibles
            </Typography>
          </Paper>
        </GridLegacy>
      </GridLegacy>

      {/* Onglets */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label={`Abonnements (${subscriptions.length})`} />
            <Tab label={`Plans (${plans.length})`} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : subscriptions.length === 0 ? (
            <Alert severity="info">Aucun abonnement trouvé</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="right">Montant</TableCell>
                    <TableCell>Période</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id} hover>
                      <TableCell>{subscription.client?.name || `Client ${subscription.clientId}`}</TableCell>
                      <TableCell>{subscription.plan?.name || `Plan ${subscription.planId}`}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(subscription.status)}
                          color={getStatusColor(subscription.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {subscription.plan && formatCurrency(subscription.plan.amount * subscription.quantity)}
                      </TableCell>
                      <TableCell>
                        {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {subscription.status === 'ACTIVE' && !subscription.cancelAtPeriodEnd && (
                            <IconButton
                              size="small"
                              onClick={async () => {
                                if (confirm('Annuler à la fin de la période ?')) {
                                  await subscriptionsService.cancelAtPeriodEnd(subscription.id)
                                  await loadSubscriptions()
                                }
                              }}
                              title="Annuler à la fin de la période"
                            >
                              <Cancel />
                            </IconButton>
                          )}
                          {subscription.status !== 'CANCELLED' && (
                            <IconButton
                              size="small"
                              onClick={async () => {
                                if (confirm('Annuler immédiatement cet abonnement ?')) {
                                  await subscriptionsService.cancelNow(subscription.id)
                                  await loadSubscriptions()
                                }
                              }}
                              title="Annuler immédiatement"
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setPlanDialogOpen(true)}
            >
              Nouveau plan
            </Button>
          </Stack>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : plans.length === 0 ? (
            <Alert severity="info">Aucun plan trouvé</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell align="right">Montant</TableCell>
                    <TableCell>Période</TableCell>
                    <TableCell>Essai</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id} hover>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell align="right">{formatCurrency(plan.amount)}</TableCell>
                      <TableCell>{plan.interval === 'MONTH' ? 'Mensuel' : 'Annuel'}</TableCell>
                      <TableCell>{plan.trialDays ? `${plan.trialDays} jours` : 'Non'}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <IconButton size="small" title="Modifier">
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={async () => {
                              if (confirm('Supprimer ce plan ?')) {
                                await subscriptionsService.deletePlan(plan.id)
                                await loadPlans()
                              }
                            }}
                            title="Supprimer"
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Card>

      {/* Dialog nouveau plan */}
      <Dialog
        open={planDialogOpen}
        onClose={() => {
          setPlanDialogOpen(false)
          resetPlanForm()
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nouveau plan d’abonnement</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nom du plan"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
            <TextField
              fullWidth
              label="Montant"
              type="number"
              value={planAmount}
              onChange={(e) => setPlanAmount(e.target.value === '' ? '' : Number(e.target.value))}
            />
            <FormControl fullWidth>
              <InputLabel>Devise</InputLabel>
              <Select
                value={planCurrency}
                label="Devise"
                onChange={(e) => setPlanCurrency(e.target.value as string)}
              >
                <MenuItem value="EUR">EUR (€)</MenuItem>
                <MenuItem value="USD">USD ($)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Période</InputLabel>
              <Select
                value={planInterval}
                label="Période"
                onChange={(e) => setPlanInterval(e.target.value as 'MONTH' | 'YEAR')}
              >
                <MenuItem value="MONTH">Mensuel</MenuItem>
                <MenuItem value="YEAR">Annuel</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Jours d’essai (optionnel)"
              type="number"
              value={planTrialDays}
              onChange={(e) => setPlanTrialDays(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setPlanDialogOpen(false)
              resetPlanForm()
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleCreatePlan}
            disabled={savingPlan}
          >
            {savingPlan ? 'Création...' : 'Créer le plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog nouvel abonnement */}
      <Dialog
        open={subscriptionDialogOpen}
        onClose={() => {
          setSubscriptionDialogOpen(false)
          resetSubscriptionForm()
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nouvel abonnement</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="ID client"
              type="number"
              value={subscriptionClientId}
              onChange={(e) =>
                setSubscriptionClientId(e.target.value === '' ? '' : Number(e.target.value))
              }
              helperText="Sélectionnera le client côté serveur à partir de son ID"
            />
            <FormControl fullWidth>
              <InputLabel>Plan</InputLabel>
              <Select
                value={subscriptionPlanId === '' ? '' : subscriptionPlanId}
                label="Plan"
                onChange={(e) =>
                  setSubscriptionPlanId(e.target.value === '' ? '' : Number(e.target.value))
                }
              >
                <MenuItem value="">
                  <em>Sélectionner un plan</em>
                </MenuItem>
                {plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name} — {formatCurrency(plan.amount)} /{' '}
                    {plan.interval === 'MONTH' ? 'mois' : 'an'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Quantité"
              type="number"
              value={subscriptionQuantity}
              onChange={(e) =>
                setSubscriptionQuantity(e.target.value === '' ? '' : Number(e.target.value))
              }
            />
            <TextField
              fullWidth
              label="Date de début"
              type="date"
              value={subscriptionStartDate}
              onChange={(e) => setSubscriptionStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSubscriptionDialogOpen(false)
              resetSubscriptionForm()
            }}
          >
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSubscription}
            disabled={savingSubscription}
          >
            {savingSubscription ? 'Création...' : 'Créer l’abonnement'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
