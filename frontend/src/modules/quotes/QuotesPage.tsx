import { useState, useEffect, useMemo, useRef } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { Card, CardContent } from '@mui/material';
import { DocumentFolderPageShell } from '../../components/finance/DocumentFolderPageShell';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CreateQuoteDialog } from './components/CreateQuoteDialog';
import { SendQuoteDialog, type SendQuotePayload } from './components/SendQuoteDialog';
import { QuoteFolderMobileList } from './components/QuoteFolderMobileList';
import { QuoteRowActionsMenu } from './components/QuoteRowActionsMenu';
import {
  financeTableHeadSx,
  financeTableSx,
} from '../../components/finance/financeStyles';
import { useQuotes } from '../../hooks/useStores';
import type { Quote } from '../../types/quote';
import type { CreateQuoteData } from '../../types/quote';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useRealtimeRowHighlight } from '../../hooks/useRealtimeRowHighlight';
import { getRealtimeRowSx } from '../../utils/realtimeRowHighlight';
import {
  buildDocumentFolderListRowRail,
  documentFolderRailCellClass,
  documentFolderTableRowClass,
  DocumentFolderBulkTableBodyCell,
  DocumentFolderBulkTableHeaderCell,
  DocumentFolderRailTableHeaderCell,
  getDocumentFolderRailHeaderRowSx,
  getDocumentFolderRailTableCellSx,
} from '../../components/finance/DocumentFolderListRowRail';
import { DocumentFolderRowCheckbox } from '../../components/finance/DocumentFolderRowCheckbox';
import { DocumentFolderBulkBar } from '../../components/finance/DocumentFolderBulkBar';
import { useDocumentFolderSelection } from '../../hooks/useDocumentFolderSelection';
import { runBulkArchive } from '../../utils/bulkArchive';
import {
  isDocumentFolder,
  DOCUMENT_FOLDER_LABELS,
  sortOutgoingNewestFirst,
  type DocumentFolder,
} from '../../types/documentFolders';
import {
  documentFolderPageSubtitle,
  documentFolderTableCardSx,
  documentFolderTableCardWrapSx,
  documentFolderTableCardContentSx,
  documentFolderTableCardContentPaddedSx,
  documentFolderTableContainerSx,
  documentFolderTableSx,
  documentFolderUnreadRowSx,
  documentFolderBulkRowSx,
  documentFolderTableHeadSx,
  folderColHideBelowXl,
} from '../../components/finance/documentFolderStyles';
import { FinanceDocumentSearch } from '../../components/finance/FinanceDocumentSearch';
import { DocumentFolderPartyCell } from '../../components/finance/DocumentFolderPartyCell';
import { DocumentFolderContentSkeleton } from '../../components/loading/DocumentFolderContentSkeleton';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  buildQuoteSearchEntry,
  filterItemsByDocumentSearch,
} from '../../utils/financeDocumentSearch';
import { quoteService } from '../../services/quoteService';
import { resolveQuoteDisplayStatus } from './quoteDisplayStatus';
import { openInvoiceView } from '../../utils/openDocumentView';
import { useQuotesFolderList } from '../../hooks/useQuotesFolderList';
import { useOptimisticDocumentFlagsPatch } from '../../hooks/useOptimisticDocumentFlagsPatch';
import { DocumentFolderLoadMore } from '../../components/finance/DocumentFolderLoadMore';
import { useToast } from '../../components/useToast';
import { useUserDocumentTags } from '../../services/userDocumentTags';
import { organizationService, type OrganizationProfile } from '../../services/organizationService';
import { unwrapApiPayload } from '../../services/clients';
import { useDocumentFolderCreateDialog } from '../../hooks/useDocumentFolderCreateDialog';

export function QuotesPage() {
  const { folder: folderParam } = useParams<{ folder?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFolder: DocumentFolder = isDocumentFolder(folderParam) ? folderParam : 'inbox';
  const defaultClientId = searchParams.get('clientId') ?? undefined;
  const navigate = useNavigate();
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'));
  const isWideActions = useMediaQuery(theme.breakpoints.up('lg'));
  const quotesStore = useQuotes();
  const toast = useToast();
  const { savedTags, rememberTag, removeFromLibrary } = useUserDocumentTags();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [quoteToSend, setQuoteToSend] = useState<Quote | null>(null);
  const [sendingQuoteEmail, setSendingQuoteEmail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 320);
  const {
    quotes,
    total,
    loading,
    loadingMore,
    folderCounts,
    countsReady,
    hasMore,
    loadMore,
    refresh,
    setItems,
  } = useQuotesFolderList(activeFolder, debouncedSearch);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveTargetIds, setArchiveTargetIds] = useState<string[]>([]);
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const {
    open: createDialogOpen,
    openDialog: openCreateDialog,
    close: closeCreateDialog,
  } = useDocumentFolderCreateDialog();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const highlightRows = useRealtimeRowHighlight('quotes');
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const onRealtime = () => {
      void refreshRef.current();
    };
    window.addEventListener('facturio:quote-realtime', onRealtime);
    return () => window.removeEventListener('facturio:quote-realtime', onRealtime);
  }, []);

  const searchOptions = useMemo(
    () =>
      quotes.map((q) =>
        buildQuoteSearchEntry(q, resolveQuoteDisplayStatus(q).label).option,
      ),
    [quotes],
  );

  const displayedQuotes = useMemo(() => {
    const sorted = sortOutgoingNewestFirst(quotes);
    return filterItemsByDocumentSearch(sorted, debouncedSearch, (q) =>
      buildQuoteSearchEntry(q, resolveQuoteDisplayStatus(q).label).searchable,
    );
  }, [quotes, debouncedSearch]);

  const contentKey = `${activeFolder}-${debouncedSearch}`;
  const initialLoading = loading && quotes.length === 0;

  const selection = useDocumentFolderSelection(
    displayedQuotes,
    `${activeFolder}-${debouncedSearch}`,
  );

  const openArchiveDialog = (ids: string[]) => {
    if (ids.length === 0) return;
    setArchiveTargetIds(ids);
    setArchiveDialogOpen(true);
  };

  useEffect(() => {
    const quoteId = searchParams.get('quoteId');
    if (quoteId) {
      setSearchTerm(quoteId);
      const next = new URLSearchParams(searchParams);
      next.delete('quoteId');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const patchDocumentFlags = useOptimisticDocumentFlagsPatch<Quote>(
    setItems,
    (id, patch) => quoteService.updateDocumentFlags(String(id), patch),
    (message) => toast.error(message),
  );

  const handleArchiveConfirm = async () => {
    if (archiveTargetIds.length === 0) return;
    try {
      setBulkArchiving(true);
      const { succeeded, failed } = await runBulkArchive(archiveTargetIds, (id) =>
        quoteService.archiveQuote(id),
      );
      if (failed === 0) {
        toast.success(
          succeeded === 1 ? 'Devis archivé' : `${succeeded} devis archivés`,
        );
      } else {
        toast.error(`${succeeded} archivé(s), ${failed} échec(s)`);
      }
      setArchiveDialogOpen(false);
      setArchiveTargetIds([]);
      selection.clear();
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'archivage");
    } finally {
      setBulkArchiving(false);
    }
  };

  const openSendQuoteDialog = (quote: Quote) => {
    setQuoteToSend(quote);
    setSendDialogOpen(true);
  };

  const handleSendQuote = async (payload: SendQuotePayload) => {
    if (!quoteToSend) return;
    try {
      setSendingQuoteEmail(true);
      const res = await quoteService.sendQuote(quoteToSend.id, payload);
      const body = unwrapApiPayload<{ copiesSent?: string[] }>(res);
      const copies = body?.copiesSent ?? [];
      let msg = `Devis ${quoteToSend.number} envoyé à ${payload.to}`;
      if (copies.length > 0) {
        msg += ` — copie(s) : ${copies.join(', ')}`;
      }
      toast.success(msg);
      setSendDialogOpen(false);
      setQuoteToSend(null);
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'envoi du devis", {
        autoHide: false,
        duration: 14000,
        action: (
          <Button
            component={RouterLink}
            to="/parametres/paiements"
            variant="contained"
            color="warning"
            size="small"
            sx={{ ml: 1 }}
          >
            Ouvrir Paiements
          </Button>
        ),
      });
    } finally {
      setSendingQuoteEmail(false);
    }
  };

  const handleRemindDeposit = async (quote: Quote) => {
    try {
      const ok = await quotesStore.remindDepositQuote(quote.id);
      if (!ok) {
        toast.error("Impossible de relancer l'acompte (facture introuvable ou déjà payée).");
        return;
      }
      toast.success('Relance de l’acompte envoyée');
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la relance");
    }
  };

  const handleViewOrConvertInvoice = async (quote: Quote) => {
    if (quote.invoiceId) {
      openInvoiceView(quote.invoiceId);
      return;
    }
    const invoiceId = await quotesStore.convertToInvoice(quote.id);
    await refresh();
    if (invoiceId) {
      openInvoiceView(invoiceId);
    }
  };

  const createQuoteInFlightRef = useRef(false);

  const handleCreateQuote = async (data: CreateQuoteData) => {
    if (createQuoteInFlightRef.current || quotesStore.isCreating) return;
    createQuoteInFlightRef.current = true;
    try {
      const quote = await quotesStore.createQuote(data);
      if (quote) {
        closeCreateDialog();
        await refresh();
        try {
          const full = await quoteService.getQuote(quote.id);
          setQuoteToSend(full);
        } catch {
          setQuoteToSend(quote);
        }
        setSendDialogOpen(true);
      }
    } finally {
      createQuoteInFlightRef.current = false;
    }
  };

  const folderFilters = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <FinanceDocumentSearch
          value={searchTerm}
          onChange={setSearchTerm}
          options={searchOptions}
          loading={false}
          resourceLabel="Devis"
          placeholder="N°, client, statut, montant… (ex. dev 250 payé)"
          onSelect={(opt) => {
            if (opt?.label) setSearchTerm(opt.label);
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
  );

  return (
    <DocumentFolderPageShell
      resource="devis"
      title={DOCUMENT_FOLDER_LABELS[activeFolder]}
      subtitle={documentFolderPageSubtitle('devis')}
      counts={folderCounts}
      activeFolder={activeFolder}
      onNew={openCreateDialog}
      newLabel="Nouveau devis"
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpen={() => setMobileNavOpen(true)}
      onMobileNavClose={() => setMobileNavOpen(false)}
      filters={folderFilters}
      contentKey={contentKey}
      loading={loading}
      initialLoading={initialLoading}
      countsLoading={!countsReady}
    >
      {initialLoading ? (
        <DocumentFolderContentSkeleton
          rows={8}
          variant={isNarrow ? 'cards' : 'table'}
          initial
          resourceLabel="devis"
        />
      ) : (
        <Card sx={[documentFolderTableCardSx, documentFolderTableCardWrapSx] as SxProps<Theme>}>
          <CardContent sx={documentFolderTableCardContentSx}>
            {isNarrow ? (
              <Box sx={documentFolderTableCardContentPaddedSx}>
              <QuoteFolderMobileList
                quotes={displayedQuotes}
                highlightRows={highlightRows}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onPatchFlags={patchDocumentFlags}
                onEdit={(q) => navigate(`/devis/${q.id}/edit`)}
                onSend={openSendQuoteDialog}
                onConvert={(q) => void handleViewOrConvertInvoice(q)}
                onArchive={(q) => openArchiveDialog([String(q.id)])}
                selection={selection}
                onRemindDeposit={(q) => void handleRemindDeposit(q)}
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
                            if (selection.allVisibleSelected) selection.clear();
                            else selection.selectAllVisible();
                          },
                        }}
                      />
                      <DocumentFolderRailTableHeaderCell />
                      <TableCell sx={{ width: '14%' }}>N° Devis</TableCell>
                      <TableCell sx={{ width: '24%' }}>Client</TableCell>
                      <TableCell sx={{ width: '10%' }}>Statut</TableCell>
                      <TableCell align="right" sx={{ width: '10%' }}>
                        Montant
                      </TableCell>
                      <TableCell sx={{ ...folderColHideBelowXl, width: '9%' }}>Validité</TableCell>
                      <TableCell align="center" sx={{ width: isWideActions ? 200 : 56 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedQuotes.map((quote) => {
                      const rowHighlight = highlightRows[String(quote.id)];
                      const quoteId = String(quote.id);
                      const railParts = buildDocumentFolderListRowRail({
                        kind: 'quote',
                        item: quote,
                        onUpdate: (patch) => patchDocumentFlags(quote.id, patch),
                        tagsSlot: {
                          tags: quote.tags ?? [],
                          onChange: (tags) => patchDocumentFlags(quote.id, { tags }),
                          savedTags,
                          onRememberTag: rememberTag,
                          onRemoveSavedTag: removeFromLibrary,
                        },
                      });
                      return (
                        <TableRow
                          key={quote.id}
                          hover
                          className={documentFolderTableRowClass}
                          sx={
                            [
                              railParts.rowAccentSx,
                              !quote.seenAt ? documentFolderUnreadRowSx : {},
                              documentFolderBulkRowSx(
                                selection.isSelected(quoteId),
                                selection.selectionActive,
                              ),
                              getRealtimeRowSx(rowHighlight),
                            ] as SxProps<Theme>
                          }
                        >
                          <DocumentFolderBulkTableBodyCell>
                            <DocumentFolderRowCheckbox
                              checked={selection.isSelected(quoteId)}
                              visible={selection.selectionActive}
                              onToggle={() => selection.toggle(quoteId)}
                              inputProps={{ 'aria-label': `Sélectionner ${quote.number}` }}
                            />
                          </DocumentFolderBulkTableBodyCell>
                          <TableCell
                            className={documentFolderRailCellClass}
                            sx={getDocumentFolderRailTableCellSx({ withTags: true })}
                          >
                            {railParts.rail}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={quote.seenAt ? 600 : 700} noWrap>
                              {quote.number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                              {formatDate(quote.date)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <DocumentFolderPartyCell
                              name={quote.client?.name ?? `Client #${quote.clientId}`}
                              email={quote.client?.email}
                              emphasize={!quote.seenAt}
                            />
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const display = resolveQuoteDisplayStatus(quote);
                              return (
                                <Chip
                                  label={display.label}
                                  color={display.color}
                                  size="small"
                                  sx={{ fontWeight: 600, borderRadius: 1.5, maxWidth: '100%' }}
                                />
                              );
                            })()}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium" noWrap>
                              {formatCurrency(quote.total)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={folderColHideBelowXl}>
                            <Typography variant="body2" noWrap>
                              {quote.expiryDate ? formatDate(quote.expiryDate) : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <QuoteRowActionsMenu
                              quote={quote}
                              expanded={isWideActions}
                              onEdit={() => navigate(`/devis/${quote.id}/edit`)}
                              onSend={() => openSendQuoteDialog(quote)}
                              onConvert={() => void handleViewOrConvertInvoice(quote)}
                              onRemindDeposit={() => void handleRemindDeposit(quote)}
                              onArchive={() => openArchiveDialog([String(quote.id)])}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {displayedQuotes.length === 0 && !loading && (
              <Box sx={[documentFolderTableCardContentPaddedSx, { textAlign: 'center', py: 4, color: 'text.secondary' }] as SxProps<Theme>}>
                <Typography variant="body1">
                  {searchTerm.trim()
                    ? 'Aucun devis ne correspond à la recherche'
                    : `Aucun devis dans « ${DOCUMENT_FOLDER_LABELS[activeFolder]} » — bouton dans le menu latéral`}
                </Typography>
              </Box>
            )}

            <Box sx={documentFolderTableCardContentPaddedSx}>
            <DocumentFolderBulkBar
              count={selection.selectedCount}
              resourceLabel="devis"
              busy={bulkArchiving}
              onArchive={() => openArchiveDialog(Array.from(selection.selectedIds))}
              onClear={selection.clear}
            />

            <DocumentFolderLoadMore
              loaded={quotes.length}
              total={total}
              loading={loadingMore}
              onLoadMore={loadMore}
            />
            </Box>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={archiveDialogOpen}
        title={archiveTargetIds.length > 1 ? 'Archiver les devis' : 'Archiver le devis'}
        message={
          archiveTargetIds.length > 1
            ? `Archiver ${archiveTargetIds.length} devis ? Consultables dans Archives (aucune suppression).`
            : 'Archiver ce devis ? Consultable dans Archives (aucune suppression).'
        }
        confirmText="Archiver"
        loading={bulkArchiving}
        onConfirm={() => void handleArchiveConfirm()}
        onClose={() => {
          if (bulkArchiving) return;
          setArchiveDialogOpen(false);
          setArchiveTargetIds([]);
        }}
      />

      <CreateQuoteDialog
        open={createDialogOpen}
        onClose={() => !quotesStore.isCreating && closeCreateDialog()}
        onSubmit={handleCreateQuote}
        submitting={quotesStore.isCreating}
        defaultClientId={defaultClientId}
      />

      <SendQuoteDialog
        open={sendDialogOpen}
        quote={quoteToSend}
        sending={sendingQuoteEmail}
        onClose={() => {
          setSendDialogOpen(false);
          setQuoteToSend(null);
        }}
        onSend={handleSendQuote}
      />
    </DocumentFolderPageShell>
  );
}


