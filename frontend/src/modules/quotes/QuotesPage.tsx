import { useState, useEffect, useMemo } from 'react';
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
import { DocumentTagsEditor } from '../../components/finance/DocumentTagsEditor';
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
import { DocumentFolderRowActions } from '../../components/finance/DocumentFolderRowActions';
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
  documentFolderTableContainerSx,
  documentFolderTableSx,
  documentFolderUnreadRowSx,
  folderColHideBelowLg,
  folderColHideBelowXl,
} from '../../components/finance/documentFolderStyles';
import { FinanceDocumentSearch } from '../../components/finance/FinanceDocumentSearch';
import { DocumentFolderContentSkeleton } from '../../components/loading/DocumentFolderContentSkeleton';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  buildQuoteSearchEntry,
  filterItemsByDocumentSearch,
} from '../../utils/financeDocumentSearch';
import { quoteService } from '../../services/quoteService';
import { openInvoiceView } from '../../utils/openDocumentView';
import { useQuotesFolderList } from '../../hooks/useQuotesFolderList';
import { useOptimisticDocumentFlagsPatch } from '../../hooks/useOptimisticDocumentFlagsPatch';
import { DocumentFolderLoadMore } from '../../components/finance/DocumentFolderLoadMore';
import { useToast } from '../../components/useToast';
import { useUserDocumentTags } from '../../services/userDocumentTags';
import { organizationService, type OrganizationProfile } from '../../services/organizationService';
import { unwrapApiPayload } from '../../services/clients';

const QUOTE_STATUS_COLORS = {
  DRAFT: 'default',
  SENT: 'primary',
  ACCEPTED: 'success',
  REJECTED: 'error',
  EXPIRED: 'warning'
} as const;

const QUOTE_STATUS_LABELS = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Rejeté',
  EXPIRED: 'Expiré'
} as const;

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
  const [quoteToArchive, setQuoteToArchive] = useState<Quote | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const highlightRows = useRealtimeRowHighlight('quotes');

  const searchOptions = useMemo(
    () =>
      quotes.map((q) =>
        buildQuoteSearchEntry(q, QUOTE_STATUS_LABELS[q.status]).option,
      ),
    [quotes],
  );

  const displayedQuotes = useMemo(() => {
    const sorted = sortOutgoingNewestFirst(quotes);
    return filterItemsByDocumentSearch(sorted, debouncedSearch, (q) =>
      buildQuoteSearchEntry(q, QUOTE_STATUS_LABELS[q.status]).searchable,
    );
  }, [quotes, debouncedSearch]);

  const contentKey = `${activeFolder}-${debouncedSearch}`;
  const initialLoading = loading && quotes.length === 0;

  useEffect(() => {
    const quoteId = searchParams.get('quoteId');
    if (quoteId) {
      setSearchTerm(quoteId);
      const next = new URLSearchParams(searchParams);
      next.delete('quoteId');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (searchParams.get('create') !== '1') return;
    setCreateDialogOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('create');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const patchDocumentFlags = useOptimisticDocumentFlagsPatch<Quote>(
    setItems,
    (id, patch) => quoteService.updateDocumentFlags(id, patch),
    (message) => toast.error(message),
  );

  const handleArchiveQuote = async () => {
    if (quoteToArchive) {
      const success = await quotesStore.deleteQuote(quoteToArchive.id);
      if (success) {
        setArchiveDialogOpen(false);
        setQuoteToArchive(null);
        await refresh();
      }
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

  const handleAcceptQuote = async (quote: Quote) => {
    const result = await quotesStore.acceptQuote(quote.id);
    await refresh();
    if (result?.invoiceId) {
      openInvoiceView(result.invoiceId);
    }
  };

  const handlePayQuoteFull = async (quote: Quote) => {
    const result = await quotesStore.payQuote(quote.id, { mode: 'FULL' });
    await refresh();
    if (result?.invoiceId) {
      openInvoiceView(result.invoiceId);
    }
  };

  const handlePayQuoteDeposit = async (quote: Quote) => {
    const result = await quotesStore.payQuote(quote.id, { mode: 'DEPOSIT', depositRate: 0.1 });
    await refresh();
    if (result?.invoiceId) {
      openInvoiceView(result.invoiceId);
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

  const handleRejectQuote = async (quote: Quote) => {
    await quotesStore.rejectQuote(quote.id);
    await refresh();
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

  const handleCreateQuote = async (data: CreateQuoteData) => {
    const quote = await quotesStore.createQuote(data);
    if (quote) {
      setCreateDialogOpen(false);
      await refresh();
      try {
        const full = await quoteService.getQuote(quote.id);
        setQuoteToSend(full);
      } catch {
        setQuoteToSend(quote);
      }
      setSendDialogOpen(true);
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
      onNew={() => setCreateDialogOpen(true)}
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
          <CardContent sx={{ p: { xs: 1, sm: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1, md: 2 } } }}>
            {isNarrow ? (
              <QuoteFolderMobileList
                quotes={displayedQuotes}
                highlightRows={highlightRows}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onPatchFlags={patchDocumentFlags}
                onEdit={(q) => navigate(`/devis/${q.id}/edit`)}
                onSend={openSendQuoteDialog}
                onAccept={handleAcceptQuote}
                onReject={handleRejectQuote}
                onConvert={(q) => void handleViewOrConvertInvoice(q)}
                onPayFull={handlePayQuoteFull}
                onPayDeposit={handlePayQuoteDeposit}
                onArchive={(q) => {
                  setQuoteToArchive(q);
                  setArchiveDialogOpen(true);
                }}
                onRemindDeposit={(q) => void handleRemindDeposit(q)}
              />
            ) : (
              <TableContainer sx={documentFolderTableContainerSx}>
                <Table
                  size="small"
                  sx={[financeTableSx, documentFolderTableSx] as SxProps<Theme>}
                >
                  <TableHead sx={financeTableHeadSx}>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ width: 72 }} />
                      <TableCell sx={folderColHideBelowLg}>Tags</TableCell>
                      <TableCell sx={{ width: '14%' }}>N° Devis</TableCell>
                      <TableCell sx={{ width: '22%' }}>Client</TableCell>
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
                      return (
                        <TableRow
                          key={quote.id}
                          hover
                          sx={
                            [
                              getRealtimeRowSx(rowHighlight),
                              !quote.seenAt ? documentFolderUnreadRowSx : {},
                            ] as SxProps<Theme>
                          }
                        >
                          <TableCell padding="checkbox">
                            <DocumentFolderRowActions
                              starred={!!quote.starred}
                              important={!!quote.important}
                              compact
                              onUpdate={(patch) => patchDocumentFlags(quote.id, patch)}
                            />
                          </TableCell>
                          <TableCell sx={folderColHideBelowLg}>
                            <DocumentTagsEditor
                              layout="inline"
                              tags={quote.tags ?? []}
                              onChange={(tags) => patchDocumentFlags(quote.id, { tags })}
                              maxVisible={2}
                              savedTags={savedTags}
                              onRememberTag={rememberTag}
                              onRemoveSavedTag={removeFromLibrary}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={quote.seenAt ? 500 : 700} noWrap>
                              {quote.number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                              {formatDate(quote.date)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500} noWrap>
                              {quote.client?.name ?? `Client #${quote.clientId}`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={QUOTE_STATUS_LABELS[quote.status]}
                              color={QUOTE_STATUS_COLORS[quote.status]}
                              size="small"
                              sx={{ fontWeight: 600, borderRadius: 1.5, maxWidth: '100%' }}
                            />
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
                              onAccept={() => handleAcceptQuote(quote)}
                              onReject={() => handleRejectQuote(quote)}
                              onConvert={() => void handleViewOrConvertInvoice(quote)}
                              onPayFull={() => handlePayQuoteFull(quote)}
                              onPayDeposit={() => handlePayQuoteDeposit(quote)}
                              onRemindDeposit={() => void handleRemindDeposit(quote)}
                              onArchive={() => {
                                setQuoteToArchive(quote);
                                setArchiveDialogOpen(true);
                              }}
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
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography variant="body1">
                  {searchTerm.trim()
                    ? 'Aucun devis ne correspond à la recherche'
                    : `Aucun devis dans « ${DOCUMENT_FOLDER_LABELS[activeFolder]} » — bouton dans le menu latéral`}
                </Typography>
              </Box>
            )}

            <DocumentFolderLoadMore
              loaded={quotes.length}
              total={total}
              loading={loadingMore}
              onLoadMore={loadMore}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmation suppression */}
      <ConfirmDialog
        open={archiveDialogOpen}
        title="Archiver le devis"
        message={`Archiver « ${quoteToArchive?.number} » ? Consultable dans Archives (aucune suppression).`}
        confirmText="Archiver"
        onConfirm={handleArchiveQuote}
        onClose={() => {
          setArchiveDialogOpen(false);
          setQuoteToArchive(null);
        }}
      />

      <CreateQuoteDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateQuote}
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


