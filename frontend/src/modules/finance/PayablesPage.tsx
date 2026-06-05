import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import { DocumentFolderPageShell } from '../../components/finance/DocumentFolderPageShell'
import { FinanceDocumentSearch } from '../../components/finance/FinanceDocumentSearch'
import { DocumentFolderPartyCell } from '../../components/finance/DocumentFolderPartyCell'
import { DocumentFolderContentSkeleton } from '../../components/loading/DocumentFolderContentSkeleton'
import { DocumentFolderLoadMore } from '../../components/finance/DocumentFolderLoadMore'
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
import { useUserDocumentTags } from '../../services/userDocumentTags'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import {
  financeTableHeadSx,
  financeTableSx,
} from '../../components/finance/financeStyles'
import {
  documentFolderPageSubtitle,
  documentFolderTableCardSx,
  documentFolderTableCardWrapSx,
  documentFolderTableCardContentSx,
  documentFolderTableCardContentPaddedSx,
  documentFolderTableContainerSx,
  documentFolderTableSx,
  documentFolderBulkRowSx,
  documentFolderTableHeadSx,
  folderColHideBelowLg,
} from '../../components/finance/documentFolderStyles'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { payablesService, type PayableDebtRow } from '../../services/payables'
import {
  CreatePayableDebtDialog,
  type CreatePayableDebtPayload,
} from './components/CreatePayableDebtDialog'
import { SendPayableDebtDialog } from './components/SendPayableDebtDialog'
import { SendPayableDebtPaymentNoticeDialog } from './components/SendPayableDebtPaymentNoticeDialog'
import { PayableDebtRowActionsMenu } from './components/PayableDebtRowActionsMenu'
import { PayableDebtFolderMobileList } from './components/PayableDebtFolderMobileList'
import { RecordPayableDebtPaymentDialog } from './components/RecordPayableDebtPaymentDialog'
import { resolvePayableDebtDisplayStatus } from './payableDebtDisplayStatus'
import { formatEmailEngagementAt } from '../documents/documentEmailEngagement'
import type { FinanceRealtimeDetail } from '../../types/realtime'
import { useRealtimeRowHighlight } from '../../hooks/useRealtimeRowHighlight'
import { getRealtimeRowSx } from '../../utils/realtimeRowHighlight'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { usePayablesFolderList } from '../../hooks/usePayablesFolderList'
import { useOptimisticDocumentFlagsPatch } from '../../hooks/useOptimisticDocumentFlagsPatch'
import {
  isDocumentFolder,
  DOCUMENT_FOLDER_LABELS,
  sortOutgoingNewestFirst,
  type DocumentFolder,
} from '../../types/documentFolders'
import {
  buildPayableDebtSearchEntry,
  filterItemsByDocumentSearch,
} from '../../utils/financeDocumentSearch'
import { useToast } from '../../components/useToast'

export function PayablesPage() {
  const { folder: folderParam } = useParams<{ folder?: string }>()
  const activeFolder: DocumentFolder = isDocumentFolder(folderParam) ? folderParam : 'inbox'
  const navigate = useNavigate()
  const toast = useToast()
  const { savedTags, rememberTag, removeFromLibrary } = useUserDocumentTags()
  const theme = useTheme()
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'))
  const isWideActions = useMediaQuery(theme.breakpoints.up('lg'))

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebouncedValue(searchTerm, 320)
  const {
    debts,
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
  } = usePayablesFolderList(activeFolder, debouncedSearch)

  const [debtDialogOpen, setDebtDialogOpen] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [debtToSend, setDebtToSend] = useState<PayableDebtRow | null>(null)
  const [paymentDialog, setPaymentDialog] = useState<PayableDebtRow | null>(null)
  const [paymentNoticeOpen, setPaymentNoticeOpen] = useState(false)
  const [debtAfterPayment, setDebtAfterPayment] = useState<PayableDebtRow | null>(null)
  const [lastPaymentAmount, setLastPaymentAmount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [archiveTargetIds, setArchiveTargetIds] = useState<string[]>([])
  const [bulkArchiving, setBulkArchiving] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const highlightRows = useRealtimeRowHighlight('payables')
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  useEffect(() => {
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<FinanceRealtimeDetail>).detail
      if (detail?.resource !== 'payables') return
      void refreshRef.current()
    }
    window.addEventListener('facturio:payables-realtime', onRealtime)
    return () => window.removeEventListener('facturio:payables-realtime', onRealtime)
  }, [])

  const searchOptions = useMemo(
    () =>
      debts.map((d) =>
        buildPayableDebtSearchEntry(d, resolvePayableDebtDisplayStatus(d).label).option,
      ),
    [debts],
  )

  const displayedDebts = useMemo(() => {
    const sorted = sortOutgoingNewestFirst(debts)
    return filterItemsByDocumentSearch(sorted, debouncedSearch, (d) =>
      buildPayableDebtSearchEntry(d, resolvePayableDebtDisplayStatus(d).label).searchable,
    )
  }, [debts, debouncedSearch])

  const contentKey = `${activeFolder}-${debouncedSearch}`
  const initialLoading = loading && debts.length === 0

  const selection = useDocumentFolderSelection(
    displayedDebts,
    `${activeFolder}-${debouncedSearch}`,
  )

  const openArchiveDialog = (ids: string[]) => {
    if (ids.length === 0) return
    setArchiveTargetIds(ids)
    setArchiveDialogOpen(true)
  }

  const patchDocumentFlags = useOptimisticDocumentFlagsPatch<PayableDebtRow>(
    setItems,
    (id, patch) => payablesService.updateDebtFlags(Number(id), patch),
    (message) => toast.error(message),
  )

  const handleCreateDebt = async (payload: CreatePayableDebtPayload) => {
    setSaving(true)
    setError(null)
    try {
      const debt = await payablesService.createDebt({
        creditorId: payload.creditorId,
        label: payload.label,
        totalAmount: payload.totalAmount,
        ...(payload.dueDate ? { dueDate: payload.dueDate } : {}),
        ...(payload.notes ? { notes: payload.notes } : {}),
      })
      toast.success('Dette enregistrée')
      setDebtDialogOpen(false)
      setDebtToSend(debt)
      setSendDialogOpen(true)
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur à la création')
    } finally {
      setSaving(false)
    }
  }

  const openSendDialog = (debt: PayableDebtRow) => {
    setDebtToSend(debt)
    setSendDialogOpen(true)
  }

  const handleCopyPublicLink = async (debt: PayableDebtRow) => {
    try {
      const res = debt.publicToken
        ? { url: `${window.location.origin}/dette/${debt.publicToken}` }
        : await payablesService.preparePublicLink(debt.id)
      try {
        await navigator.clipboard.writeText(res.url)
        toast.success('Lien copié')
      } catch {
        window.prompt('Copiez ce lien :', res.url)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Impossible de générer le lien')
    }
  }

  const handleCancelDebt = async (debt: PayableDebtRow) => {
    const ok = window.confirm(
      `Annuler la dette « ${debt.label} » ?\n\nAucune suppression : le dossier reste en historique avec le statut « Annulée ».`,
    )
    if (!ok) return
    setError(null)
    try {
      await payablesService.cancelDebt(debt.id)
      toast.success('Dette annulée')
      await refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Annulation impossible')
    }
  }

  const handleArchiveConfirm = async () => {
    if (archiveTargetIds.length === 0) return
    try {
      setBulkArchiving(true)
      const { succeeded, failed } = await runBulkArchive(archiveTargetIds, (id) =>
        payablesService.archiveDebt(Number(id)),
      )
      if (failed === 0) {
        toast.success(
          succeeded === 1 ? 'Dette archivée' : `${succeeded} dettes archivées`,
        )
      } else {
        toast.error(`${succeeded} archivée(s), ${failed} échec(s)`)
      }
      setArchiveDialogOpen(false)
      setArchiveTargetIds([])
      selection.clear()
      await refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Archivage impossible')
    } finally {
      setBulkArchiving(false)
    }
  }

  const folderFilters = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <FinanceDocumentSearch
          value={searchTerm}
          onChange={setSearchTerm}
          options={searchOptions}
          loading={false}
          resourceLabel="Dettes"
          placeholder="Libellé, créancier, statut, montant…"
          onSelect={(opt) => {
            if (opt?.label) setSearchTerm(opt.label)
          }}
        />
      </Box>
      <Tooltip title="Actualiser">
        <span>
          <IconButton
            size="small"
            onClick={() => void refresh()}
            disabled={loading}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  )

  return (
    <DocumentFolderPageShell
      resource="dettes"
      folderBasePath="/dettes"
      excludeFolders={['important']}
      title={DOCUMENT_FOLDER_LABELS[activeFolder]}
      subtitle={documentFolderPageSubtitle('dettes')}
      counts={folderCounts}
      activeFolder={activeFolder}
      onNew={() => setDebtDialogOpen(true)}
      newLabel="Nouvelle dette"
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpen={() => setMobileNavOpen(true)}
      onMobileNavClose={() => setMobileNavOpen(false)}
      filters={folderFilters}
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
          resourceLabel="dettes"
        />
      ) : (
        <Card sx={[documentFolderTableCardSx, documentFolderTableCardWrapSx] as SxProps<Theme>}>
          <CardContent sx={documentFolderTableCardContentSx}>
            {isNarrow ? (
              <Box sx={documentFolderTableCardContentPaddedSx}>
              <PayableDebtFolderMobileList
                debts={displayedDebts}
                highlightRows={highlightRows}
                onPatchFlags={patchDocumentFlags}
                onView={(d) => navigate(`/dettes/voir/${d.id}`)}
                onSend={openSendDialog}
                onCopyLink={(d) => void handleCopyPublicLink(d)}
                onRecordPayment={setPaymentDialog}
                onArchive={(d) => openArchiveDialog([String(d.id)])}
                selection={selection}
                onCancelDebt={(d) => void handleCancelDebt(d)}
                savedTags={savedTags}
                onRememberTag={rememberTag}
                onRemoveSavedTag={removeFromLibrary}
              />
              </Box>
            ) : (
              <TableContainer sx={documentFolderTableContainerSx}>
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
                      <TableCell>Créancier</TableCell>
                      <TableCell>Libellé</TableCell>
                      <TableCell align="right">Initial</TableCell>
                      <TableCell align="right" sx={folderColHideBelowLg}>
                        Déjà payé
                      </TableCell>
                      <TableCell align="right">Reste</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell align="center" sx={{ width: isWideActions ? 200 : 56 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedDebts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          Aucune dette dans ce dossier.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedDebts.map((d) => {
                        const display = resolvePayableDebtDisplayStatus(d)
                        const eng = d.emailEngagement
                        const statusTitle = eng?.sentAt
                          ? [
                              eng.sentAt && `Envoyé : ${formatEmailEngagementAt(eng.sentAt)}`,
                              eng.openedAt && `Ouvert : ${formatEmailEngagementAt(eng.openedAt)}`,
                              eng.clickedAt && `Cliqué : ${formatEmailEngagementAt(eng.clickedAt)}`,
                            ]
                              .filter(Boolean)
                              .join('\n')
                          : undefined
                        const rowHighlight = highlightRows[String(d.id)]
                        const railParts = buildDocumentFolderListRowRail({
                          kind: 'payable_debt',
                          item: d,
                          onUpdate: (patch) => void patchDocumentFlags(d.id, patch),
                          tagsSlot: {
                            tags: d.tags ?? [],
                            onChange: (tags) => void patchDocumentFlags(d.id, { tags }),
                            savedTags,
                            onRememberTag: rememberTag,
                            onRemoveSavedTag: removeFromLibrary,
                          },
                        })
                        return (
                          <TableRow
                            key={d.id}
                            hover
                            className={documentFolderTableRowClass}
                            sx={
                              [
                                railParts.rowAccentSx,
                                documentFolderBulkRowSx(
                                  selection.isSelected(d.id),
                                  selection.selectionActive,
                                ),
                                getRealtimeRowSx(rowHighlight),
                              ] as SxProps<Theme>
                            }
                          >
                            <DocumentFolderBulkTableBodyCell>
                              <DocumentFolderRowCheckbox
                                checked={selection.isSelected(d.id)}
                                visible={selection.selectionActive}
                                onToggle={() => selection.toggle(d.id)}
                                inputProps={{ 'aria-label': `Sélectionner ${d.label}` }}
                              />
                            </DocumentFolderBulkTableBodyCell>
                            <TableCell
                              className={documentFolderRailCellClass}
                              sx={getDocumentFolderRailTableCellSx({ withTags: true })}
                            >
                              {railParts.rail}
                            </TableCell>
                            <TableCell>
                              <DocumentFolderPartyCell
                                name={d.creditorName}
                                email={d.creditorEmail}
                                href={`/dettes/voir/${d.id}`}
                                emphasize={!d.seenAt}
                              />
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25 }}>
                                {formatDate(d.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <RouterLink
                                to={`/dettes/voir/${d.id}`}
                                style={{ color: 'inherit', textDecoration: 'underline' }}
                              >
                                {d.label}
                              </RouterLink>
                            </TableCell>
                            <TableCell align="right">{formatCurrency(d.totalAmount)}</TableCell>
                            <TableCell align="right" sx={folderColHideBelowLg}>
                              {formatCurrency(d.totalPaid)}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {formatCurrency(d.balance)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={display.label}
                                color={display.color}
                                title={statusTitle}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <PayableDebtRowActionsMenu
                                debt={d}
                                onView={() => navigate(`/dettes/voir/${d.id}`)}
                                onSend={() => openSendDialog(d)}
                                onCopyLink={() => void handleCopyPublicLink(d)}
                                onRecordPayment={() => setPaymentDialog(d)}
                                onArchive={() => openArchiveDialog([String(d.id)])}
                                onCancelDebt={() => void handleCancelDebt(d)}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box sx={documentFolderTableCardContentPaddedSx}>
            <DocumentFolderBulkBar
              count={selection.selectedCount}
              resourceLabel="dette"
              busy={bulkArchiving}
              onArchive={() => openArchiveDialog(Array.from(selection.selectedIds))}
              onClear={selection.clear}
            />

            <DocumentFolderLoadMore
              loaded={debts.length}
              total={total}
              loading={loadingMore}
              onLoadMore={() => void loadMore()}
            />
            </Box>
          </CardContent>
        </Card>
      )}

      <CreatePayableDebtDialog
        open={debtDialogOpen}
        saving={saving}
        onClose={() => setDebtDialogOpen(false)}
        onSubmit={handleCreateDebt}
      />

      <SendPayableDebtDialog
        open={sendDialogOpen}
        debt={debtToSend}
        onClose={() => {
          setSendDialogOpen(false)
          setDebtToSend(null)
        }}
        onSent={() => refresh()}
      />

      <RecordPayableDebtPaymentDialog
        open={paymentDialog != null}
        debt={paymentDialog}
        onClose={() => setPaymentDialog(null)}
        onRecorded={async (updated, amount) => {
          toast.success(
            updated.status === 'PAID' ? 'Dette soldée' : 'Remboursement enregistré',
          )
          setPaymentDialog(null)
          setDebtAfterPayment(updated)
          setLastPaymentAmount(amount)
          setPaymentNoticeOpen(true)
          await refresh()
        }}
      />

      <SendPayableDebtPaymentNoticeDialog
        open={paymentNoticeOpen}
        debt={debtAfterPayment}
        paymentAmount={lastPaymentAmount}
        onClose={() => {
          setPaymentNoticeOpen(false)
          setDebtAfterPayment(null)
          setLastPaymentAmount(0)
        }}
        onSent={() => refresh()}
      />

      <ConfirmDialog
        open={archiveDialogOpen}
        title={archiveTargetIds.length > 1 ? 'Archiver les dettes' : 'Archiver cette dette ?'}
        message={
          archiveTargetIds.length > 1
            ? `Archiver ${archiveTargetIds.length} dettes ? Elles resteront accessibles dans Archives.`
            : 'Cette dette sera déplacée dans Archives. Vous pourrez la restaurer plus tard.'
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
