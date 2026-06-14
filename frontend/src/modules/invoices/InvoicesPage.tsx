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
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
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
import { DocumentFolderInitialLoader } from '../../components/loading/DocumentFolderInitialLoader'
import { DocumentFolderContentSkeleton } from '../../components/loading/DocumentFolderContentSkeleton'
import { FinanceDocumentSearch } from '../../components/finance/FinanceDocumentSearch'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  buildInvoiceSearchEntry,
  filterItemsByDocumentSearch,
} from '../../utils/financeDocumentSearch'
import { CreateInvoiceDialog } from './components/CreateInvoiceDialog'
import { InvoiceInstallmentBadge } from './components/InvoiceInstallmentBadge'
import { InvoiceFolderMobileList } from './components/InvoiceFolderMobileList'
import { InvoiceRowActionsMenu } from './components/InvoiceRowActionsMenu'
import { SendInvoiceDialog, type SendInvoicePayload } from './components/SendInvoiceDialog'
import { useRealtimeRowHighlight } from '../../hooks/useRealtimeRowHighlight'
import { resolveInvoiceDisplayStatus } from './invoiceDisplayStatus'
import { getRealtimeRowSx } from '../../utils/realtimeRowHighlight'
import {
  buildDocumentFolderListRowRail,
  documentFolderRailCellClass,
  documentFolderTableRowClass,
  DocumentFolderBulkTableBodyCell,
  DocumentFolderBulkTableHeaderCell,
  DocumentFolderRailTableHeaderCell,
  getDocumentFolderRailHeaderRowSx,
  getDocumentFolderRailTableCellSx,
} from '../../components/finance/DocumentFolderListRowRail'
import { DocumentFolderRowCheckbox } from '../../components/finance/DocumentFolderRowCheckbox'
import { DocumentFolderBulkBar } from '../../components/finance/DocumentFolderBulkBar'
import { useDocumentFolderSelection } from '../../hooks/useDocumentFolderSelection'
import { runBulkArchive } from '../../utils/bulkArchive'
import {
  useDocumentFolderNewRowMotion,
  useDocumentFolderRowMotion,
} from '../../hooks/useDocumentFolderRowMotion'
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
  documentFolderTableCardContentSx,
  documentFolderTableCardContentPaddedSx,
  documentFolderTableCardFooterSx,
  documentFolderTableContainerSx,
  documentFolderTableSx,
  documentFolderUnreadRowSx,
  documentFolderBulkRowSx,
  documentFolderTableHeadSx,
  documentFolderColInvoiceSx,
  documentFolderColClientSx,
  documentFolderColStatusSx,
  documentFolderColAmountSx,
  documentFolderColDueSx,
  documentFolderColActionsSx,
} from '../../components/finance/documentFolderStyles'
import { DocumentFolderPartyCell } from '../../components/finance/DocumentFolderPartyCell'
import { DocumentFolderStatusChip } from '../../components/finance/DocumentFolderStatusChip'
import { useDocumentFolderCreateDialog } from '../../hooks/useDocumentFolderCreateDialog'
import {
  folderCountsAfterArchive,
  folderCountsAfterInboxCreate,
} from '../../utils/documentFolderListMutations'
import { patchInvoiceFromRealtimeDetail } from '../../utils/financeRealtimeListPatch'
import { scheduleDebounced } from '../../utils/scheduleDebounced'
import type { FinanceRealtimeDetail } from '../../types/realtime'
import { resolveInvoiceDueDisplay } from '../../utils/invoiceInstallmentLabels'

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
    coldLoading,
    folderLoading,
    error,
    setError,
    folderCounts,
    countsReady,
    hasMore,
    loadMore,
    refresh,
    refreshSilent,
    setItems,
    removeItemsById,
    prependItems,
    patchItemById,
    bumpFolderCounts,
  } = useInvoicesFolderList(activeFolder, debouncedSearch)
  const {
    open: createDialogOpen,
    openDialog: openCreateDialog,
    close: closeCreateDialog,
  } = useDocumentFolderCreateDialog()
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
  const rowMotion = useDocumentFolderRowMotion()

  const lastToastError = useRef<string | null>(null)
  useEffect(() => {
    if (!error || error === lastToastError.current) return
    lastToastError.current = error
    toast.error(error)
  }, [error, toast])

  const refreshRef = useRef(refresh)
  refreshRef.current = refresh
  const refreshSilentRef = useRef(refreshSilent)
  refreshSilentRef.current = refreshSilent

  const patchDocumentFlags = useOptimisticDocumentFlagsPatch<Invoice>(
    setItems,
    (id, patch) => invoiceService.updateDocumentFlags(String(id), patch),
    (message) => toast.error(message),
  )

  const itemsRef = useRef(invoices)
  itemsRef.current = invoices

  useEffect(() => {
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<FinanceRealtimeDetail>).detail
      if (detail?.id == null) return
      patchItemById(detail.id, (inv) => patchInvoiceFromRealtimeDetail(inv, detail))
      const action = detail.action
      if (action === 'created' || action === 'deleted') {
        void refreshRef.current()
        return
      }
      const row = itemsRef.current.find((inv) => String(inv.id) === String(detail.id))
      const isRemainderInvoice =
        (detail.number ?? row?.number ?? '').toUpperCase().startsWith('SOL-')
      if (action === 'paid' || action === 'sent') {
        scheduleDebounced(() => void refreshSilentRef.current())
      } else if (action === 'updated' && (isRemainderInvoice || !row)) {
        scheduleDebounced(() => void refreshSilentRef.current())
      }
    }
    window.addEventListener('facturio:invoice-realtime', onRealtime)
    return () => window.removeEventListener('facturio:invoice-realtime', onRealtime)
  }, [patchItemById])

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

  const searchOptions = useMemo(
    () =>
      invoices.map((inv) =>
        buildInvoiceSearchEntry(inv, resolveInvoiceDisplayStatus(inv).label).option,
      ),
    [invoices],
  )

  const displayedInvoices = useMemo(() => {
    const sorted = sortOutgoingNewestFirst(invoices)
    return filterItemsByDocumentSearch(sorted, debouncedSearch, (inv) =>
      buildInvoiceSearchEntry(inv, resolveInvoiceDisplayStatus(inv).label).searchable,
    )
  }, [invoices, debouncedSearch])

  useDocumentFolderNewRowMotion(
    displayedInvoices.map((inv) => inv.id),
    rowMotion,
  )

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
  const createInvoiceInFlightRef = useRef(false)

  const handleCreateInvoice = async (data: CreateInvoiceData) => {
    if (creating || createInvoiceInFlightRef.current) return
    createInvoiceInFlightRef.current = true
    try {
      setCreating(true)
      const response = await invoiceService.createInvoiceFromApi(toCreateInvoiceApiBody(data))
      const created = normalizeInvoiceFromApi(
        unwrapApiPayload<Record<string, unknown>>(response)
      )
      closeCreateDialog()
      if (activeFolder === 'inbox' && !debouncedSearch.trim()) {
        prependItems([created])
        bumpFolderCounts(folderCountsAfterInboxCreate(!created.seenAt))
      }
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
      createInvoiceInFlightRef.current = false
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
      const sentId = invoiceToSend.id
      setInvoiceToSend(null)
      patchItemById(sentId, (inv) => ({
        ...inv,
        status: inv.status === 'draft' ? 'sent' : inv.status,
        sentAt: new Date().toISOString(),
        emailSent: true,
      }))
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
    const idsToArchive = archiveTargetIds
    if (idsToArchive.length === 0) return
    setArchiveDialogOpen(false)
    setArchiveTargetIds([])
    selection.clear()
    try {
      setBulkArchiving(true)
      const { succeeded, failed, succeededIds } = await rowMotion.runArchiveWithRailExit(
        idsToArchive,
        () =>
          runBulkArchive(idsToArchive, (id) => invoiceService.archiveInvoice(id)),
      )
      apiClient.invalidateCache('/invoices')
      if (succeededIds.length > 0) {
        removeItemsById(succeededIds)
        if (!debouncedSearch.trim()) {
          bumpFolderCounts(folderCountsAfterArchive(activeFolder, succeededIds.length))
        }
      }
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

  const shellProps = {
    resource: 'factures' as const,
    title: DOCUMENT_FOLDER_LABELS[activeFolder],
    subtitle: documentFolderPageSubtitle('factures'),
    counts: folderCounts,
    activeFolder,
    onNew: openCreateDialog,
    newLabel: 'Nouvelle facture',
    mobileNavOpen,
    onMobileNavOpen: () => setMobileNavOpen(true),
    onMobileNavClose: () => setMobileNavOpen(false),
    filters: folderFilters,
    contentKey,
    loading,
    initialLoading: coldLoading,
    countsLoading: !countsReady,
  }

  return (
    <DocumentFolderPageShell {...shellProps}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {coldLoading ? (
        <DocumentFolderInitialLoader
          resource="factures"
          rows={8}
          variant={isNarrow ? 'cards' : 'table'}
        />
      ) : folderLoading ? (
        <DocumentFolderContentSkeleton
          rows={8}
          variant={isNarrow ? 'cards' : 'table'}
        />
      ) : (
      <Card
        sx={
          [
            documentFolderTableCardSx,
            documentFolderTableCardWrapSx,
            rowMotion.getMotionClipSx(),
          ] as SxProps<Theme>
        }
      >
        <CardContent sx={documentFolderTableCardContentSx}>
          {isNarrow ? (
            <Box sx={[documentFolderTableCardContentPaddedSx, rowMotion.getMotionClipSx()] as SxProps<Theme>}>
            <InvoiceFolderMobileList
              invoices={displayedInvoices}
              highlightRows={highlightRows}
              actionLoadingId={actionLoadingId}
              formatCurrency={formatCurrency}
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
              savedTags={savedTags}
              onRememberTag={rememberTag}
              onRemoveSavedTag={removeFromLibrary}
              getRowMotionSx={rowMotion.getMotionSx}
            />
            </Box>
          ) : (
          <TableContainer
            sx={[documentFolderTableContainerSx, rowMotion.getMotionClipSx()] as SxProps<Theme>}
          >
            <Table
              size="small"
              sx={[financeTableSx, documentFolderTableSx] as SxProps<Theme>}
            >
              <TableHead sx={[financeTableHeadSx, documentFolderTableHeadSx] as SxProps<Theme>}>
                <TableRow sx={getDocumentFolderRailHeaderRowSx()}>
                  <DocumentFolderBulkTableHeaderCell
                    bulkHeader={{
                      allVisibleSelected: selection.allVisibleSelected,
                      someVisibleSelected: selection.someVisibleSelected,
                      selectionActive: selection.selectionActive,
                      onToggleAll: () => {
                        if (selection.allVisibleSelected) selection.clear()
                        else selection.selectAllVisible()
                      },
                    }}
                  />
                  <DocumentFolderRailTableHeaderCell />
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
                  const railParts = buildDocumentFolderListRowRail({
                    kind: 'invoice',
                    item: invoice,
                    onUpdate: (patch) => patchDocumentFlags(invoice.id, patch),
                    tagsSlot: {
                      tags: invoice.tags ?? [],
                      onChange: (tags) => patchDocumentFlags(invoice.id, { tags }),
                      savedTags,
                      onRememberTag: rememberTag,
                      onRemoveSavedTag: removeFromLibrary,
                    },
                  })
                  const canSend =
                    invoice.status === 'draft' ||
                    invoice.status === 'sent' ||
                    invoice.status === 'overdue' ||
                    invoice.status === 'paid'
                  return (
                    <TableRow
                      key={invoice.id}
                      hover
                      className={documentFolderTableRowClass}
                      sx={
                        [
                          railParts.rowAccentSx,
                          !invoice.seenAt ? documentFolderUnreadRowSx : {},
                          documentFolderBulkRowSx(
                            selection.isSelected(invoice.id),
                            selection.selectionActive,
                          ),
                          getRealtimeRowSx(rowHighlight),
                          rowMotion.getMotionSx(invoice.id),
                        ] as SxProps<Theme>
                      }
                    >
                      <DocumentFolderBulkTableBodyCell>
                        <DocumentFolderRowCheckbox
                          checked={selection.isSelected(invoice.id)}
                          visible={selection.selectionActive}
                          onToggle={() => selection.toggle(invoice.id)}
                          inputProps={{ 'aria-label': `Sélectionner ${invoice.number}` }}
                        />
                      </DocumentFolderBulkTableBodyCell>
                      <TableCell
                        className={documentFolderRailCellClass}
                        sx={getDocumentFolderRailTableCellSx({ withTags: true })}
                      >
                        {railParts.rail}
                      </TableCell>
                      <TableCell sx={documentFolderColInvoiceSx}>
                        <Typography variant="body2" fontWeight={invoice.seenAt ? 600 : 700} noWrap>
                          {invoice.number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                        </Typography>
                        {invoice.installmentSummary?.hasPlan && (
                          <Box sx={{ mt: 0.5 }}>
                            <InvoiceInstallmentBadge summary={invoice.installmentSummary} />
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={documentFolderColClientSx}>
                        <DocumentFolderPartyCell
                          name={invoice.client.name}
                          email={invoice.client.email}
                          emphasize={!invoice.seenAt}
                        />
                      </TableCell>
                      <TableCell sx={documentFolderColStatusSx}>
                        {(() => {
                          const display = resolveInvoiceDisplayStatus(invoice)
                          return (
                            <DocumentFolderStatusChip
                              label={display.label}
                              color={display.color}
                            />
                          )
                        })()}
                      </TableCell>
                      <TableCell align="right" className="doc-folder-col-amount" sx={documentFolderColAmountSx}>
                        <Typography variant="body2" fontWeight="medium" noWrap>
                          {formatCurrency(invoice.total)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={documentFolderColDueSx}>
                        <Typography variant="body2" noWrap>
                          {(() => {
                            const due = resolveInvoiceDueDisplay(
                              invoice.dueDate,
                              invoice.installmentSummary,
                            )
                            return due ? new Date(due).toLocaleDateString('fr-FR') : '—'
                          })()}
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
            <Box sx={[documentFolderTableCardContentPaddedSx, { textAlign: 'center', py: 4, color: 'text.secondary' }] as SxProps<Theme>}>
              <Typography variant="body1">
                {searchTerm.trim()
                  ? 'Aucune facture ne correspond à la recherche'
                  : `Aucune facture dans « ${DOCUMENT_FOLDER_LABELS[activeFolder]} » — bouton dans le menu latéral`}
              </Typography>
            </Box>
          )}

          <Box sx={documentFolderTableCardFooterSx}>
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
          </Box>
        </CardContent>
      </Card>
      )}

      <CreateInvoiceDialog
        open={createDialogOpen}
        onClose={() => !creating && closeCreateDialog()}
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
        onConfirm={() => void handleArchiveConfirm()}
        onClose={() => {
          if (bulkArchiving) return
          setArchiveDialogOpen(false)
          setArchiveTargetIds([])
        }}
      />
    </DocumentFolderPageShell>
  )
}
