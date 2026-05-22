import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
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
  type DocumentFolderCounts,
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
import { quoteService } from '../../services/quoteService';
import { unwrapApiPayload } from '../../services/invoices';

const EMPTY_COUNTS: DocumentFolderCounts = {
  inbox: 0,
  nouveau: 0,
  suivi: 0,
  attente: 0,
  important: 0,
  envoyes: 0,
  brouillons: 0,
};

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
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 320);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [quoteToArchive, setQuoteToArchive] = useState<Quote | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [folderCounts, setFolderCounts] = useState<DocumentFolderCounts>(EMPTY_COUNTS);
  const [countsReady, setCountsReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const highlightRows = useRealtimeRowHighlight('quotes');

  const loadCounts = useCallback(async () => {
    try {
      const res = await quoteService.getFolderCounts();
      const data = unwrapApiPayload<DocumentFolderCounts>(res);
      if (data) setFolderCounts({ ...EMPTY_COUNTS, ...data });
    } catch {
      /* ignore */
    } finally {
      setCountsReady(true);
    }
  }, []);

  const loadQuotes = useCallback(async () => {
    const filters: Record<string, string> = { folder: activeFolder };
    if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
    quotesStore.setFilters(filters);
    await quotesStore.fetchQuotes(filters, 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- quotesStore stable
  }, [activeFolder, debouncedSearch]);

  const reloadListAndCounts = useCallback(async () => {
    await Promise.all([loadQuotes(), loadCounts()]);
  }, [loadQuotes, loadCounts]);

  const searchOptions = useMemo(
    () =>
      quotesStore.quotes.map((q) => ({
        id: String(q.id),
        label: q.number,
        sublabel: q.client?.name ?? `Client #${q.clientId}`,
      })),
    [quotesStore.quotes],
  );

  const contentKey = `${activeFolder}-${debouncedSearch}`;
  const loading = quotesStore.isLoading;
  const initialLoading = loading && quotesStore.quotes.length === 0;

  useEffect(() => {
    void loadQuotes();
  }, [loadQuotes]);

  useEffect(() => {
    void loadCounts();
  }, [activeFolder, loadCounts]);

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

  const patchDocumentFlags = async (id: number, patch: Parameters<typeof quoteService.updateDocumentFlags>[1]) => {
    await quoteService.updateDocumentFlags(id, patch);
    await reloadListAndCounts();
  };

  const handleArchiveQuote = async () => {
    if (quoteToArchive) {
      const success = await quotesStore.deleteQuote(quoteToArchive.id);
      if (success) {
        setArchiveDialogOpen(false);
        setQuoteToArchive(null);
      }
    }
  };

  const handleSendQuote = async (quote: Quote) => {
    await quotesStore.sendQuote(quote.id);
  };

  const handleAcceptQuote = async (quote: Quote) => {
    const result = await quotesStore.acceptQuote(quote.id);
    if (result?.invoiceId) {
      navigate(`/factures/${result.invoiceId}`);
    }
  };

  const handleRejectQuote = async (quote: Quote) => {
    await quotesStore.rejectQuote(quote.id);
  };

  const handleConvertToInvoice = async (quote: Quote) => {
    const invoiceId = await quotesStore.convertToInvoice(quote.id);
    if (invoiceId) {
      navigate(`/factures/${invoiceId}`);
    }
  };

  const handleCreateQuote = async (data: CreateQuoteData) => {
    const quote = await quotesStore.createQuote(data);
    if (quote) {
      setCreateDialogOpen(false);
    }
  };

  const displayedQuotes = useMemo(
    () => sortOutgoingNewestFirst(quotesStore.quotes),
    [quotesStore.quotes],
  );

  const folderFilters = (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <FinanceDocumentSearch
          value={searchTerm}
          onChange={setSearchTerm}
          options={searchOptions}
          loading={loading && !!debouncedSearch.trim()}
          placeholder="N° devis ou client…"
          onSelect={(opt) => {
            if (opt?.label) setSearchTerm(opt.label);
          }}
        />
      </Box>
      <Tooltip title="Actualiser">
        <span>
          <IconButton
            size="small"
            onClick={() => void loadQuotes()}
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
                onSend={handleSendQuote}
                onAccept={handleAcceptQuote}
                onReject={handleRejectQuote}
                onConvert={handleConvertToInvoice}
                onArchive={(q) => {
                  setQuoteToArchive(q);
                  setArchiveDialogOpen(true);
                }}
              />
            ) : (
              <TableContainer sx={{ ...documentFolderTableContainerSx, maxHeight: 600 }}>
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
                              compact
                              tags={quote.tags ?? []}
                              onChange={(tags) => patchDocumentFlags(quote.id, { tags })}
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
                              onSend={() => handleSendQuote(quote)}
                              onAccept={() => handleAcceptQuote(quote)}
                              onReject={() => handleRejectQuote(quote)}
                              onConvert={() => handleConvertToInvoice(quote)}
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

            {displayedQuotes.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography variant="body1">
                  {searchTerm.trim()
                    ? 'Aucun devis ne correspond à la recherche'
                    : `Aucun devis dans « ${DOCUMENT_FOLDER_LABELS[activeFolder]} » — bouton dans le menu latéral`}
                </Typography>
              </Box>
            )}
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
    </DocumentFolderPageShell>
  );
}


