import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  Stack,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { Upload, Download } from '@mui/icons-material'
import { clientService, toCreateClientPayload, type Client, type ClientFolder } from '../../services/clients'
import { useClientsFolderList } from '../../hooks/useClientsFolderList'
import { DocumentFolderLoadMore } from '../../components/finance/DocumentFolderLoadMore'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DocumentFolderPageShell } from '../../components/finance/DocumentFolderPageShell'
import {
  ClientFolderSidebar,
  ClientFolderMobileMenuButton,
} from '../../components/finance/ClientFolderSidebar'
import { ClientFolderSidebarSkeleton } from '../../components/loading/ClientFolderSidebarSkeleton'
import { FinanceDocumentSearch } from '../../components/finance/FinanceDocumentSearch'
import { DocumentFolderContentSkeleton } from '../../components/loading/DocumentFolderContentSkeleton'
import {
  financeTableHeadSx,
  financeTableSx,
} from '../../components/finance/financeStyles'
import {
  documentFolderTableCardSx,
  documentFolderTableCardWrapSx,
  documentFolderTableContainerSx,
  documentFolderTableSx,
  folderColHideBelowLg,
  folderColHideBelowXl,
} from '../../components/finance/documentFolderStyles'
import {
  isClientFolder,
  CLIENT_FOLDER_LABELS,
  clientFolderPageSubtitle,
} from '../../types/clientFolders'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  buildClientSearchEntry,
  filterItemsByDocumentSearch,
} from '../../utils/financeDocumentSearch'
import {
  ClientFormDialog,
  clientToFormValues,
  emptyClientFormValues,
  validateClientFormValues,
  type ClientFormValues,
} from './components/ClientFormDialog'
import { ClientFolderMobileList } from './components/ClientFolderMobileList'
import { ClientRowActionsMenu } from './components/ClientRowActionsMenu'
import { formatCurrency, formatDate } from '../../utils/formatters'
import {
  openClientView,
  openCreateInvoiceForClient,
  openCreateQuoteForClient,
} from '../../utils/openDocumentView'

export function ClientsPage() {
  const { folder: folderParam } = useParams<{ folder?: string }>()
  const activeFolder: ClientFolder = isClientFolder(folderParam) ? folderParam : 'inbox'
  const navigate = useNavigate()
  const theme = useTheme()
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'))
  const isWideActions = useMediaQuery(theme.breakpoints.up('lg'))

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebouncedValue(searchTerm, 320)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const {
    clients,
    total,
    loading,
    loadingMore,
    error,
    setError,
    folderCounts,
    countsReady,
    hasMore,
    loadMore,
    refresh,
  } = useClientsFolderList(activeFolder, debouncedSearch)

  const [formDialogMode, setFormDialogMode] = useState<'create' | 'edit' | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [clientForm, setClientForm] = useState<ClientFormValues>(emptyClientFormValues)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'default'
      case 'prospect':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return 'Actif'
      case 'inactive':
        return 'Inactif'
      case 'prospect':
        return 'Prospect'
      default:
        return status
    }
  }

  const searchOptions = useMemo(
    () =>
      clients.map((c) => buildClientSearchEntry(c, getStatusLabel(c.status)).option),
    [clients],
  )

  const displayedClients = useMemo(() => {
    return filterItemsByDocumentSearch(clients, debouncedSearch, (c) =>
      buildClientSearchEntry(c, getStatusLabel(c.status)).searchable,
    )
  }, [clients, debouncedSearch])

  const contentKey = `${activeFolder}-${debouncedSearch}`
  const initialLoading = loading && clients.length === 0

  const handleExportClients = async () => {
    try {
      const blob = await clientService.exportClients({
        search: debouncedSearch.trim() || undefined,
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `clients_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'export")
    }
  }

  const resetClientForm = () => {
    setClientForm(emptyClientFormValues)
    setFormError(null)
  }

  const validateClientForm = (): boolean => {
    const message = validateClientFormValues(clientForm)
    if (message) {
      setFormError(message)
      return false
    }
    return true
  }

  const handleOpenCreateDialog = () => {
    resetClientForm()
    if (activeFolder === 'prospects') {
      setClientForm({ ...emptyClientFormValues, status: 'prospect' })
    }
    setFormDialogMode('create')
  }

  const handleOpenEditDialog = (client: Client) => {
    setClientForm(clientToFormValues(client))
    setFormError(null)
    setSelectedClientId(client.id)
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
          status: clientForm.status,
        })
        await clientService.createClient(payload as never)
      } else if (formDialogMode === 'edit' && selectedClientId) {
        await clientService.updateClient({
          id: selectedClientId,
          name,
          email,
          phone: clientForm.phone.trim() || undefined,
          siren: clientForm.siren || undefined,
          address: clientForm.address
            ? { street: clientForm.address, city: '', postalCode: '', country: 'FR' }
            : undefined,
          status: clientForm.status,
        })
      }

      setFormDialogMode(null)
      resetClientForm()
      setSelectedClientId(null)
      await refresh()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement impossible')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!selectedClientId) return
    try {
      setDeleting(true)
      await clientService.deleteClient(selectedClientId)
      setDeleteDialogOpen(false)
      setSelectedClientId(null)
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Suppression impossible')
    } finally {
      setDeleting(false)
    }
  }

  const selectedClient = selectedClientId ? clients.find((c) => c.id === selectedClientId) : null

  const handleImportClients = async () => {
    if (!importFile) return
    try {
      setError(null)
      const importResponse = await clientService.importClients(importFile, (progress) => {
        setImportProgress(progress)
      })
      if (importResponse.data) {
        alert(
          `Import réussi: ${importResponse.data.imported} client(s) importé(s)${
            importResponse.data.errors.length > 0
              ? `, ${importResponse.data.errors.length} erreur(s)`
              : ''
          }`,
        )
        setImportDialogOpen(false)
        setImportFile(null)
        setImportProgress(0)
        await refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import")
    }
  }

  const headerExtra = (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" justifyContent="flex-end">
      <Tooltip title="Importer CSV">
        <IconButton size="small" onClick={() => setImportDialogOpen(true)} aria-label="Importer">
          <Upload fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Exporter CSV">
        <IconButton size="small" onClick={() => void handleExportClients()} aria-label="Exporter">
          <Download fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  )

  const folderFilters = (
    <FinanceDocumentSearch
      value={searchTerm}
      onChange={setSearchTerm}
      options={searchOptions}
      loading={false}
      resourceLabel="Clients"
      placeholder="Nom, email, statut, SIREN… (ex. dupont actif)"
      onSelect={(opt) => {
        if (!opt?.href) return
        const match = opt.href.match(/^\/clients\/([^/]+)$/)
        if (match?.[1]) openClientView(match[1])
      }}
    />
  )

  const sidebar = (
    <ClientFolderSidebar
      counts={folderCounts}
      activeFolder={activeFolder}
      onNew={handleOpenCreateDialog}
      newLabel="Nouveau client"
      mobileOpen={mobileNavOpen}
      onMobileClose={() => setMobileNavOpen(false)}
      countsLoading={!countsReady}
    />
  )

  return (
    <DocumentFolderPageShell
      title={CLIENT_FOLDER_LABELS[activeFolder]}
      subtitle={clientFolderPageSubtitle()}
      sidebar={
        initialLoading ? (
          <>
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>{sidebar}</Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <ClientFolderSidebarSkeleton />
            </Box>
          </>
        ) : (
          sidebar
        )
      }
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpen={() => setMobileNavOpen(true)}
      onMobileNavClose={() => setMobileNavOpen(false)}
      filters={
        <Stack direction="row" spacing={1} alignItems="center">
          <ClientFolderMobileMenuButton onClick={() => setMobileNavOpen(true)} />
          <Box sx={{ flex: 1, minWidth: 0 }}>{folderFilters}</Box>
        </Stack>
      }
      headerExtra={headerExtra}
      contentKey={contentKey}
      loading={loading}
      initialLoading={initialLoading}
      countsLoading={!countsReady}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {initialLoading ? (
        <DocumentFolderContentSkeleton
          rows={8}
          variant={isNarrow ? 'cards' : 'table'}
          initial
          resourceLabel="clients"
        />
      ) : (
        <Card sx={[documentFolderTableCardSx, documentFolderTableCardWrapSx] as SxProps<Theme>}>
          <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1, md: 2 } } }}>
            {isNarrow ? (
              <ClientFolderMobileList
                clients={displayedClients}
                getStatusLabel={getStatusLabel}
                getStatusColor={getStatusColor}
                onView={(c) => openClientView(c.id)}
                onEdit={handleOpenEditDialog}
                onDelete={(c) => {
                  setSelectedClientId(c.id)
                  setDeleteDialogOpen(true)
                }}
                onNewQuote={(c) => openCreateQuoteForClient(c.id)}
                onNewInvoice={(c) => openCreateInvoiceForClient(c.id)}
              />
            ) : (
              <TableContainer sx={documentFolderTableContainerSx}>
                <Table size="small" sx={[financeTableSx, documentFolderTableSx] as SxProps<Theme>}>
                  <TableHead sx={financeTableHeadSx}>
                    <TableRow>
                      <TableCell sx={{ width: '24%' }}>Client</TableCell>
                      <TableCell sx={folderColHideBelowLg}>Contact</TableCell>
                      <TableCell sx={{ width: '10%' }} align="right">
                        CA
                      </TableCell>
                      <TableCell sx={{ ...folderColHideBelowXl, width: '11%' }}>
                        Dernière facture
                      </TableCell>
                      <TableCell sx={{ width: '9%' }}>Statut</TableCell>
                      <TableCell sx={{ ...folderColHideBelowXl, width: '10%' }}>SIREN</TableCell>
                      <TableCell align="center" sx={{ width: isWideActions ? 220 : 56 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedClients.map((client) => (
                      <TableRow key={client.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.25}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                              {client.name.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                noWrap
                                component="button"
                                type="button"
                                onClick={() => openClientView(client.id)}
                                sx={{
                                  border: 0,
                                  p: 0,
                                  bgcolor: 'transparent',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  font: 'inherit',
                                  color: 'primary.main',
                                  '&:hover': { textDecoration: 'underline' },
                                }}
                              >
                                {client.name}
                              </Typography>
                              {client.company?.name && (
                                <Typography variant="caption" color="text.secondary" noWrap display="block">
                                  {client.company.name}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={folderColHideBelowLg}>
                          <Typography variant="body2" noWrap>
                            {client.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {client.phone || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatCurrency(client.revenueTotal ?? 0)}
                          </Typography>
                          {(client.invoiceCount ?? 0) > 0 && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {client.invoiceCount} facture{(client.invoiceCount ?? 0) > 1 ? 's' : ''}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={folderColHideBelowXl}>
                          <Typography variant="body2">
                            {client.lastInvoiceAt
                              ? formatDate(client.lastInvoiceAt)
                              : 'Aucune'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(client.status)}
                            color={getStatusColor(client.status)}
                            size="small"
                            sx={{ fontWeight: 600, borderRadius: 1.5 }}
                          />
                        </TableCell>
                        <TableCell sx={folderColHideBelowXl}>
                          <Typography variant="body2" noWrap>
                            {client.siren || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <ClientRowActionsMenu
                            expanded={isWideActions}
                            onView={() => openClientView(client.id)}
                            onEdit={() => handleOpenEditDialog(client)}
                            onDelete={() => {
                              setSelectedClientId(client.id)
                              setDeleteDialogOpen(true)
                            }}
                            onNewQuote={() => openCreateQuoteForClient(client.id)}
                            onNewInvoice={() => openCreateInvoiceForClient(client.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {displayedClients.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography variant="body1">
                  {searchTerm.trim()
                    ? 'Aucun client ne correspond à la recherche'
                    : `Aucun client dans « ${CLIENT_FOLDER_LABELS[activeFolder]} »`}
                </Typography>
              </Box>
            )}

            <DocumentFolderLoadMore
              loaded={clients.length}
              total={total}
              loading={loadingMore}
              onLoadMore={loadMore}
            />
          </CardContent>
        </Card>
      )}

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
            <Button variant="outlined" component="label" fullWidth startIcon={<Upload />}>
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
          <Button
            onClick={() => {
              setImportDialogOpen(false)
              setImportFile(null)
              setImportProgress(0)
            }}
          >
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
    </DocumentFolderPageShell>
  )
}
