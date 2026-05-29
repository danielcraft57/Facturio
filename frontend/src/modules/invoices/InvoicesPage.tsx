import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Checkbox,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import {
  Add,
} from '@mui/icons-material'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { financeOutlinedButtonSx } from '../../components/finance/financeStyles'
import { logActivity } from '../../utils/activity'
import { apiClient } from '../../services/api'
import {
  invoiceService,
  normalizeInvoiceFromApi,
  toCreateInvoiceApiBody,
  unwrapApiPayload,
} from '../../services/invoices'
import { useInvoicesFolderList } from '../../hooks/useInvoicesFolderList'
import { useOptimisticDocumentFlagsPatch } from '../../hooks/useOptimisticDocumentFlagsPatch'
import { DocumentFolderLoadMore } from '../../components/finance/DocumentFolderLoadMore'
import type { CreateInvoiceData, Invoice } from '../../services/invoices'
import { useToast } from '../../components/useToast'
import { DocumentFolderPageShell } from '../../components/finance/DocumentFolderPageShell'
import {
  financeCardSx,
  financePrimaryButtonSx,
  financeTableHeadSx,
  financeTableSx,
} from '../../components/finance/financeStyles'
import { DocumentFolderContentSkeleton } from '../../components/loading/DocumentFolderContentSkeleton'
import { FinanceDocumentSearch } from '../../components/finance/FinanceDocumentSearch'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  buildInvoiceSearchEntry,
  filterItemsByDocumentSearch,
} from '../../utils/financeDocumentSearch'
import { CreateInvoiceDialog } from './components/CreateInvoiceDialog'
import { InvoiceFolderMobileList } from './components/InvoiceFolderMobileList'
import { InvoiceRowActionsMenu } from './components/InvoiceRowActionsMenu'
import { SendInvoiceDialog, type SendInvoicePayload } from './components/SendInvoiceDialog'
import { useRealtimeRowHighlight } from '../../hooks/useRealtimeRowHighlight'
import { getRealtimeRowSx } from '../../utils/realtimeRowHighlight'
import { DocumentFolderRowActions } from '../../components/finance/DocumentFolderRowActions'
import { DocumentFolderRowCheckbox } from '../../components/finance/DocumentFolderRowCheckbox'
import { DocumentFolderBulkBar } from '../../components/finance/DocumentFolderBulkBar'
import { useDocumentFolderSelection } from '../../hooks/useDocumentFolderSelection'
import { runBulkArchive } from '../../utils/bulkArchive'
import { DocumentTagsEditor } from '../../components/finance/DocumentTagsEditor'
import { useUserDocumentTags } from '../../services/userDocumentTags'
import {
  isDocumentFolder,
  DOCUMENT_FOLDER_LABELS,
  sortOutgoingNewestFirst,
  type DocumentFolder,
} from '../../types/documentFolders'
import {
  documentFolderPageSubtitle,
  documentFolderTableCardSx,
  documentFolderTableCardWrapSx,
  documentFolderTableContainerSx,
  documentFolderTableSx,
  documentFolderUnreadRowSx,
  documentFolderBulkRowSx,
  documentFolderBulkLeadCellSx,
  documentFolderBulkCellClass,
  documentFolderTableHeadSx,
  documentFolderColInvoiceSx,
  documentFolderColClientSx,
  documentFolderColStatusSx,
  documentFolderColAmountSx,
  documentFolderColDueSx,
  documentFolderColActionsSx,
  documentFolderBulkCheckboxSx,
  documentFolderBulkCheckboxClass,
} from '../../components/finance/documentFolderStyles'

export function InvoicesPage() {
  const { folder: folderParam } = useParams<{ folder?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeFolder: DocumentFolder = isDocumentFolder(folderParam) ? folderParam : 'inbox'
  const defaultClientId = searchParams.get('clientId') ?? undefined
  const navigate = useNavigate()
  const toast = useToast()
  const { savedTags, rememberTag, removeFromLibrary } = useUserDocumentTags()
  const theme = useTheme()
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'))
  const isWideActions = useMediaQuery(theme.breakpoints.up('lg'))

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebouncedValue(searchTerm, 320)
  const {
    invoices,
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
    setItems,
  } = useInvoicesFolderList(activeFolder, debouncedSearch)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [invoiceToSend, setInvoiceToSend] = useState<Invoice | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [archiveTargetIds, setArchiveTargetIds] = useState<string[]>([])
  const [bulkArchiving, setBulkArchiving] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const highlightRows = useRealtimeRowHighlight('invoices')

  const lastToastError = useRef<string | null>(null)
  useEffect(() => {
    if (!error || error === lastToastError.current) return
    lastToastError.current = error
    toast.error(error)
  }, [error, toast])

  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  useEffect(() => {
    if (searchParams.get('create') !== '1') return
    setCreateDialogOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('create')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const patchDocumentFlags = useOptimisticDocumentFlagsPatch<Invoice>(
    setItems,
    (id, patch) => invoiceService.updateDocumentFlags(id, patch),
    (message) => toast.error(message),
  )

  useEffect(() => {
    const onRealtime = () => {
      void refreshRef.current()
    }
    window.addEventListener('facturio:invoice-realtime', onRealtime)
    return () => window.removeEventListener('facturio:invoice-realtime', onRealtime)
  }, [])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)

  const openInvoice = async (invoice: Invoice) => {
    if (!invoice.seenAt) {
      try {
        await patchDocumentFlags(invoice.id, { markSeen: true })
      } catch {
        /* ignore */
      }
    }
    const { openInvoiceView } = await import('../../utils/openDocumentView')
    openInvoiceView(invoice.id)
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

  const searchOptions = useMemo(
    () =>
      invoices.map((inv) =>
        buildInvoiceSearchEntry(inv, getStatusLabel(inv.status)).option,
      ),
    [invoices],
  )

  const displayedInvoices = useMemo(() => {
    const sorted = sortOutgoingNewestFirst(invoices)
    return filterItemsByDocumentSearch(sorted, debouncedSearch, (inv) =>
      buildInvoiceSearchEntry(inv, getStatusLabel(inv.status)).searchable,
    )
  }, [invoices, debouncedSearch])

  const selection = useDocumentFolderSelection(
    displayedInvoices,
    `${activeFolder}-${debouncedSearch}`,
  )

  const openArchiveDialog = (ids: string[]) => {
    if (ids.length === 0) return
    setArchiveTargetIds(ids)
    setArchiveDialogOpen(true)
  }

  const contentKey = `${activeFolder}-${debouncedSearch}`

  const handleCreateInvoice = async (data: CreateInvoiceData) => {
    try {
      setCreating(true)
      const response = await invoiceService.createInvoiceFromApi(toCreateInvoiceApiBody(data))
      const created = normalizeInvoiceFromApi(
        unwrapApiPayload<Record<string, unknown>>(response)
      )
      setCreateDialogOpen(false)
      await refresh()
      toast.success(`Facture ${created.number} créée`)

      const clientEmail = data.clientEmail?.trim()
      const invoiceForSend: Invoice =
        clientEmail && !created.client?.email?.trim()
          ? { ...created, client: { ...created.client, email: clientEmail } }
          : created
      setInvoiceToSend(invoiceForSend)
      setSendDialogOpen(true)
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
        copyToSelf: payload.copyToSelf,
        additionalRecipients: payload.additionalRecipients,
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
      await refresh()
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

  const handleArchiveConfirm = async () => {
    if (archiveTargetIds.length === 0) return
    try {
      setBulkArchiving(true)
      const { succeeded, failed } = await runBulkArchive(archiveTargetIds, (id) =>
        invoiceService.archiveInvoice(id),
      )
      apiClient.invalidateCache('/invoices')
      if (failed === 0) {
        toast.success(
          succeeded === 1
            ? 'Facture archivée'
            : `${succeeded} factures archivées`,
        )
      } else {
        toast.error(`${succeeded} archivée(s), ${failed} échec(s)`)
      }
      if (succeeded > 0) {
        logActivity({
          type: 'info',
          title: succeeded === 1 ? 'Facture archivée' : 'Factures archivées',
          message: String(succeeded),
          category: 'invoice',
          href: '/factures/archives',
        })
      }
      setArchiveDialogOpen(false)
      setArchiveTargetIds([])
      selection.clear()
      await refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'archivage")
    } finally {
      setBulkArchiving(false)
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

  const folderFilters = (
    <FinanceDocumentSearch
      value={searchTerm}
      onChange={setSearchTerm}
      options={searchOptions}
      loading={false}
      resourceLabel="Factures"
      placeholder="N°, client, statut, montant… (ex. fac 20€ payé)"
      onSelect={(opt) => {
        if (opt?.href) navigate(opt.href)
      }}
    />
  )

  const initialLoading = loading && invoices.length === 0

  const shellProps = {
    resource: 'factures' as const,
    title: DOCUMENT_FOLDER_LABELS[activeFolder],
    subtitle: documentFolderPageSubtitle('factures'),
    counts: folderCounts,
    activeFolder,
    onNew: () => setCreateDialogOpen(true),
    newLabel: 'Nouvelle facture',
    mobileNavOpen,
    onMobileNavOpen: () => setMobileNavOpen(true),
    onMobileNavClose: () => setMobileNavOpen(false),
    filters: folderFilters,
    contentKey,
    loading,
    initialLoading,
    countsLoading: !countsReady,
  }

  return (
    <DocumentFolderPageShell {...shellProps}>
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
          resourceLabel="factures"
        />
      ) : (
      <Card sx={[documentFolderTableCardSx, documentFolderTableCardWrapSx] as SxProps<Theme>}>
        <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1, md: 2 } } }}>
          {isNarrow ? (
            <InvoiceFolderMobileList
              invoices={displayedInvoices}
              highlightRows={highlightRows}
              actionLoadingId={actionLoadingId}
              formatCurrency={formatCurrency}
              getStatusLabel={getStatusLabel}
              getStatusColor={getStatusColor}
              canRemind={canRemind}
              onPatchFlags={patchDocumentFlags}
              onNavigate={(id) => {
                const inv = displayedInvoices.find((i) => i.id === id)
                if (inv) void openInvoice(inv)
                else {
                  void import('../../utils/openDocumentView').then(({ openInvoiceView }) =>
                    openInvoiceView(id),
                  )
                }
              }}
              onEditNavigate={(id) => navigate(`/factures/${id}/edit`)}
              onSend={openSendDialog}
              onRemind={handleSendReminder}
              selection={selection}
              onArchive={(inv) => openArchiveDialog([inv.id])}
              onDownload={handleDownloadPdf}
            />
          ) : (
          <TableContainer sx={documentFolderTableContainerSx}>
            <Table
              size="small"
              sx={[financeTableSx, documentFolderTableSx] as SxProps<Theme>}
            >
              <colgroup>
                <col style={{ width: 76 }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: isWideActions ? 188 : 52 }} />
              </colgroup>
              <TableHead sx={[financeTableHeadSx, documentFolderTableHeadSx] as SxProps<Theme>}>
                <TableRow>
                  <TableCell
                    padding="checkbox"
                    className={documentFolderBulkCellClass}
                    sx={documentFolderBulkLeadCellSx}
                  >
                    <Checkbox
                      className={documentFolderBulkCheckboxClass}
                      size="small"
                      checked={selection.allVisibleSelected}
                      indeterminate={selection.someVisibleSelected}
                      onChange={() => {
                        if (selection.allVisibleSelected) selection.clear()
                        else selection.selectAllVisible()
                      }}
                      sx={{
                        ...documentFolderBulkCheckboxSx,
                        opacity: selection.selectionActive ? 1 : 0,
                        pointerEvents: selection.selectionActive ? 'auto' : 'none',
                      }}
                      inputProps={{ 'aria-label': 'Tout sélectionner sur la page' }}
                    />
                  </TableCell>
                  <TableCell sx={documentFolderColInvoiceSx}>N° Facture</TableCell>
                  <TableCell sx={documentFolderColClientSx}>Client</TableCell>
                  <TableCell sx={documentFolderColStatusSx}>Statut</TableCell>
                  <TableCell align="right" sx={documentFolderColAmountSx}>
                    Montant
                  </TableCell>
                  <TableCell sx={documentFolderColDueSx}>Échéance</TableCell>
                  <TableCell align="center" sx={documentFolderColActionsSx(isWideActions)}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedInvoices.map((invoice) => {
                  const busy = actionLoadingId === invoice.id
                  const rowHighlight = highlightRows[invoice.id]
                  const canSend =
                    invoice.status === 'draft' ||
                    invoice.status === 'sent' ||
                    invoice.status === 'overdue' ||
                    invoice.status === 'paid'
                  return (
                    <TableRow
                      key={invoice.id}
                      hover
                      sx={
                        [
                          getRealtimeRowSx(rowHighlight),
                          !invoice.seenAt ? documentFolderUnreadRowSx : {},
                          documentFolderBulkRowSx(
                            selection.isSelected(invoice.id),
                            selection.selectionActive,
                          ),
                        ] as SxProps<Theme>
                      }
                    >
                      <TableCell
                        padding="checkbox"
                        className={documentFolderBulkCellClass}
                        sx={documentFolderBulkLeadCellSx}
                      >
                        <Stack direction="row" alignItems="center" spacing={0} sx={{ ml: -0.25 }}>
                          <DocumentFolderRowCheckbox
                            checked={selection.isSelected(invoice.id)}
                            visible={selection.selectionActive}
                            onToggle={() => selection.toggle(invoice.id)}
                            inputProps={{ 'aria-label': `Sélectionner ${invoice.number}` }}
                          />
                          <DocumentFolderRowActions
                            starred={!!invoice.starred}
                            important={!!invoice.important}
                            compact
                            onUpdate={(patch) => patchDocumentFlags(invoice.id, patch)}
                          />
                        </Stack>
                      </TableCell>
                      <TableCell sx={documentFolderColInvoiceSx}>
                        <Box sx={{ minHeight: 22, mb: 0.35, minWidth: 0, maxWidth: '100%' }}>
                          <DocumentTagsEditor
                            layout="inline"
                            tags={invoice.tags ?? []}
                            onChange={(tags) => patchDocumentFlags(invoice.id, { tags })}
                            maxVisible={1}
                            savedTags={savedTags}
                            onRememberTag={rememberTag}
                            onRemoveSavedTag={removeFromLibrary}
                          />
                        </Box>
                        <Typography variant="body2" fontWeight={invoice.seenAt ? 500 : 700} noWrap>
                          {invoice.number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell sx={documentFolderColClientSx}>
                        <Typography variant="body2" fontWeight={500} noWrap>
                          {invoice.client.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          noWrap
                          display="block"
                          sx={{ display: { md: 'none', xl: 'block' } }}
                        >
                          {invoice.client.email}
                        </Typography>
                      </TableCell>
                      <TableCell sx={documentFolderColStatusSx}>
                        <Chip
                          label={getStatusLabel(invoice.status)}
                          color={getStatusColor(invoice.status) as 'success' | 'info' | 'error' | 'warning' | 'default'}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: 1.5, maxWidth: '100%' }}
                        />
                      </TableCell>
                      <TableCell align="right" className="doc-folder-col-amount" sx={documentFolderColAmountSx}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {formatCurrency(invoice.total)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={documentFolderColDueSx}>
                        <Typography variant="body2" noWrap>
                          {invoice.dueDate
                            ? new Date(invoice.dueDate).toLocaleDateString('fr-FR')
                            : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={documentFolderColActionsSx(isWideActions)}>
                        <InvoiceRowActionsMenu
                          invoice={invoice}
                          busy={busy}
                          expanded={isWideActions}
                          canSend={canSend}
                          canRemind={canRemind(invoice.status)}
                          onView={() => void openInvoice(invoice)}
                          onEdit={() => void openInvoice(invoice)}
                          onSend={() => openSendDialog(invoice)}
                          onRemind={() => handleSendReminder(invoice)}
                          onArchive={() => openArchiveDialog([invoice.id])}
                          onDownload={() => handleDownloadPdf(invoice)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          )}

          {displayedInvoices.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
              <Typography variant="body1">
                {searchTerm.trim()
                  ? 'Aucune facture ne correspond à la recherche'
                  : `Aucune facture dans « ${DOCUMENT_FOLDER_LABELS[activeFolder]} » — bouton dans le menu latéral`}
              </Typography>
            </Box>
          )}

          <DocumentFolderBulkBar
            count={selection.selectedCount}
            resourceLabel="facture"
            busy={bulkArchiving}
            onArchive={() => openArchiveDialog(Array.from(selection.selectedIds))}
            onClear={selection.clear}
          />

          <DocumentFolderLoadMore
            loaded={invoices.length}
            total={total}
            loading={loadingMore}
            onLoadMore={loadMore}
          />
        </CardContent>
      </Card>
      )}

      <CreateInvoiceDialog
        open={createDialogOpen}
        onClose={() => !creating && setCreateDialogOpen(false)}
        onSubmit={handleCreateInvoice}
        submitting={creating}
        defaultClientId={defaultClientId}
      />

      <SendInvoiceDialog
        open={sendDialogOpen}
        invoice={invoiceToSend}
        onClose={() => !sendingEmail && setSendDialogOpen(false)}
        onSend={handleSendInvoice}
        sending={sendingEmail}
      />

      <ConfirmDialog
        open={archiveDialogOpen}
        title={archiveTargetIds.length > 1 ? 'Archiver les factures' : 'Archiver la facture'}
        message={
          archiveTargetIds.length > 1
            ? `Archiver ${archiveTargetIds.length} factures ? Elles resteront accessibles dans Archives (aucune suppression).`
            : 'Archiver cette facture ? Elle restera accessible dans Archives (aucune suppression).'
        }
        confirmText="Archiver"
        loading={bulkArchiving}
        onConfirm={handleArchiveConfirm}
        onClose={() => {
          if (bulkArchiving) return
          setArchiveDialogOpen(false)
          setArchiveTargetIds([])
        }}
      />
    </DocumentFolderPageShell>
  )
}
