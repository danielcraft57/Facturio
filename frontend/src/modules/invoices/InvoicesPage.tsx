import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Alert,
} from '@mui/material'
import {
  Add,
  Search,
  FilterList,
  Edit,
  Visibility,
  Send,
  Download,
  NotificationsActive,
} from '@mui/icons-material'
import { logActivity } from '../../utils/activity'
import { apiClient } from '../../services/api'
import {
  invoiceService,
  normalizeInvoiceFromApi,
  parseInvoicesListResponse,
  toCreateInvoiceApiBody,
  unwrapApiPayload,
} from '../../services/invoices'
import type { CreateInvoiceData, Invoice } from '../../services/invoices'
import { useToast } from '../../components/Toast'
import { PageHeader } from '../../components/finance/PageHeader'
import { financeCardSx, financePagePadding, financePrimaryButtonSx } from '../../components/finance/financeStyles'
import { TablePageSkeleton } from '../../components/loading/TablePageSkeleton'
import { CreateInvoiceDialog } from './components/CreateInvoiceDialog'
import { SendInvoiceDialog, type SendInvoicePayload } from './components/SendInvoiceDialog'

export function InvoicesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [invoiceToSend, setInvoiceToSend] = useState<Invoice | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      apiClient.invalidateCache('/invoices')
      const response = await invoiceService.getInvoices({ page: 1, limit: 100 })
      setInvoices(parseInvoicesListResponse(response))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des factures'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- toast stable enough for errors
  }, [])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

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

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateInvoice = async (data: CreateInvoiceData) => {
    try {
      setCreating(true)
      const response = await invoiceService.createInvoiceFromApi(toCreateInvoiceApiBody(data))
      const created = normalizeInvoiceFromApi(
        unwrapApiPayload<Record<string, unknown>>(response)
      )
      setInvoices((prev) => [created, ...prev.filter((i) => i.id !== created.id)])
      setCreateDialogOpen(false)
      toast.success(`Facture ${created.number} créée`)

      if (data.sendByEmailAfterCreate && data.sendToEmail?.trim()) {
        try {
          await invoiceService.sendInvoice(created.id, {
            to: data.sendToEmail.trim(),
            updateClientEmail: true,
          })
          toast.success(`Facture ${created.number} envoyée à ${data.sendToEmail.trim()}`)
        } catch (sendErr: unknown) {
          toast.error(
            sendErr instanceof Error
              ? sendErr.message
              : 'Facture créée, mais envoi email échoué',
          )
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de créer la facture'
      toast.error(message)
      throw err
    } finally {
      setCreating(false)
    }
  }

  const openSendDialog = (invoice: Invoice) => {
    setInvoiceToSend(invoice)
    setSendDialogOpen(true)
  }

  const handleSendInvoice = async (payload: SendInvoicePayload) => {
    if (!invoiceToSend) return
    try {
      setSendingEmail(true)
      setActionLoadingId(invoiceToSend.id)
      await invoiceService.sendInvoice(invoiceToSend.id, {
        to: payload.to,
        updateClientEmail: payload.updateClientEmail,
      })
      toast.success(`Facture ${invoiceToSend.number} envoyée à ${payload.to}`)
      logActivity({
        type: 'success',
        title: 'Facture envoyée',
        message: `${invoiceToSend.number} → ${payload.to}`,
        category: 'invoice',
        href: `/factures/${invoiceToSend.id}`,
      })
      setSendDialogOpen(false)
      setInvoiceToSend(null)
      await loadInvoices()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi")
    } finally {
      setSendingEmail(false)
      setActionLoadingId(null)
    }
  }

  const canRemind = (status: Invoice['status']) => status === 'sent' || status === 'overdue'

  const handleSendReminder = async (invoice: Invoice) => {
    if (!window.confirm(`Envoyer une relance pour la facture ${invoice.number} à ${invoice.client.email || 'ce client'} ?`)) {
      return
    }
    try {
      setActionLoadingId(invoice.id)
      const res = await invoiceService.sendReminder(invoice.id)
      const days = res.data?.daysOverdue
      toast.success(
        days
          ? `Relance envoyée (${days} jour(s) de retard)`
          : `Relance envoyée pour ${invoice.number}`
      )
      logActivity({
        type: 'info',
        title: 'Relance envoyée',
        message: `Rappel de paiement — ${invoice.number}`,
        category: 'invoice',
        href: `/factures/${invoice.id}`,
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la relance')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      setActionLoadingId(invoice.id)
      const blob = await invoiceService.generatePDF(invoice.id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `facture-${invoice.number}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('PDF téléchargé')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du téléchargement du PDF')
    } finally {
      setActionLoadingId(null)
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: financePagePadding }}>
        <TablePageSkeleton />
      </Box>
    )
  }

  return (
    <Box sx={{ p: financePagePadding }}>
      <PageHeader
        title="Factures"
        subtitle="Émission, envoi par email et relances de paiement"
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ minWidth: { xs: '100%', sm: 'auto' }, ...financePrimaryButtonSx }}
          >
            Nouvelle facture
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3, ...financeCardSx }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr' },
              gap: 2,
              alignItems: 'center',
            }}
          >
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
              <Select value={statusFilter} label="Statut" onChange={(e) => setStatusFilter(e.target.value)}>
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

      <Card sx={financeCardSx}>
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell>N° Facture</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Statut</TableCell>
                  {!isMobile && <TableCell align="right">Montant</TableCell>}
                  {!isTablet && <TableCell>Échéance</TableCell>}
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const busy = actionLoadingId === invoice.id
                  return (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {invoice.number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: 'primary.main' }}>
                            {(invoice.client.name || '?').charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {invoice.client.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {invoice.client.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(invoice.status)}
                          color={getStatusColor(invoice.status) as 'success' | 'info' | 'error' | 'warning' | 'default'}
                          size="small"
                        />
                      </TableCell>
                      {!isMobile && (
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(invoice.total)}
                          </Typography>
                        </TableCell>
                      )}
                      {!isTablet && (
                        <TableCell>
                          {invoice.dueDate
                            ? new Date(invoice.dueDate).toLocaleDateString('fr-FR')
                            : '—'}
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <IconButton
                            size="small"
                            title="Voir"
                            disabled={busy}
                            onClick={() => navigate(`/factures/${invoice.id}`)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            title="Éditer"
                            disabled={busy}
                            onClick={() => navigate(`/factures/${invoice.id}`)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          {(invoice.status === 'draft' ||
                            invoice.status === 'sent' ||
                            invoice.status === 'overdue' ||
                            invoice.status === 'paid') && (
                            <IconButton
                              size="small"
                              title="Envoyer par email"
                              disabled={busy}
                              onClick={() => openSendDialog(invoice)}
                            >
                              <Send fontSize="small" />
                            </IconButton>
                          )}
                          {canRemind(invoice.status) && (
                            <IconButton
                              size="small"
                              title="Relancer (rappel de paiement)"
                              disabled={busy}
                              color="warning"
                              onClick={() => handleSendReminder(invoice)}
                            >
                              <NotificationsActive fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            title="Télécharger le PDF"
                            disabled={busy}
                            onClick={() => handleDownloadPdf(invoice)}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredInvoices.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography variant="body1">
                {searchTerm || statusFilter !== 'all'
                  ? 'Aucune facture ne correspond aux critères'
                  : 'Aucune facture — créez-en une avec « Nouvelle facture »'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <CreateInvoiceDialog
        open={createDialogOpen}
        onClose={() => !creating && setCreateDialogOpen(false)}
        onSubmit={handleCreateInvoice}
        submitting={creating}
      />

      <SendInvoiceDialog
        open={sendDialogOpen}
        invoice={invoiceToSend}
        onClose={() => !sendingEmail && setSendDialogOpen(false)}
        onSend={handleSendInvoice}
        sending={sendingEmail}
      />
    </Box>
  )
}
