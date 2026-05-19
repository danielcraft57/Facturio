import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Skeleton
} from '@mui/material';
//
import { Card, CardContent } from '@mui/material';
import { PageHeader } from '../../components/finance/PageHeader';
import { financeCardSx, financePagePadding, financePrimaryButtonSx } from '../../components/finance/financeStyles';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Receipt as ConvertIcon
} from '@mui/icons-material';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CreateQuoteDialog } from './components/CreateQuoteDialog';
import { useQuotes } from '../../hooks/useStores';
import type { Quote, QuoteStatus } from '../../types/quote';
import type { CreateQuoteData } from '../../types/quote';
import { formatCurrency, formatDate } from '../../utils/formatters';

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
  const navigate = useNavigate();
  const quotesStore = useQuotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Charger les devis au montage
  useEffect(() => {
    if (quotesStore.isStale) {
      quotesStore.fetchQuotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Appliquer les filtres
  useEffect(() => {
    const filters: any = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter) filters.status = statusFilter;

    quotesStore.setFilters(filters);
    quotesStore.fetchQuotes(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  const handleDeleteQuote = async () => {
    if (quoteToDelete) {
      const success = await quotesStore.deleteQuote(quoteToDelete.id);
      if (success) {
        setDeleteDialogOpen(false);
        setQuoteToDelete(null);
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

  const columns = [
    {
      id: 'number' as keyof Quote,
      label: 'Numéro',
      minWidth: 150,
      render: (quote: Quote) => (
        <Typography variant="body2" fontWeight="medium">
          {quote.number}
        </Typography>
      )
    },
    {
      id: 'client' as keyof Quote,
      label: 'Client',
      minWidth: 200,
      render: (quote: Quote) => (
        <Typography variant="body2">
          {quote.client?.name || `Client ${quote.clientId}`}
        </Typography>
      )
    },
    {
      id: 'total' as keyof Quote,
      label: 'Montant',
      minWidth: 120,
      align: 'right' as const,
      render: (quote: Quote) => (
        <Typography variant="body2" fontWeight="medium">
          {formatCurrency(quote.total)}
        </Typography>
      )
    },
    {
      id: 'status' as keyof Quote,
      label: 'Statut',
      minWidth: 120,
      align: 'center' as const,
      render: (quote: Quote) => (
        <Chip
          label={QUOTE_STATUS_LABELS[quote.status]}
          color={QUOTE_STATUS_COLORS[quote.status]}
          size="small"
        />
      )
    },
    {
      id: 'date' as keyof Quote,
      label: 'Date',
      minWidth: 120,
      render: (quote: Quote) => (
        <Typography variant="body2">
          {formatDate(quote.date)}
        </Typography>
      )
    },
    {
      id: 'expiryDate' as keyof Quote,
      label: 'Validité',
      minWidth: 120,
      render: (quote: Quote) => (
        <Typography variant="body2">
          {quote.expiryDate ? formatDate(quote.expiryDate) : '-'}
        </Typography>
      )
    },
    {
      id: 'actions' as const,
      label: 'Actions',
      minWidth: 200,
      align: 'center' as const,
      render: (quote: Quote) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Voir">
            <IconButton size="small" color="primary">
              <ViewIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Modifier">
            <IconButton size="small" color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>

          {quote.status === 'DRAFT' && (
            <Tooltip title="Envoyer">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => handleSendQuote(quote)}
              >
                <SendIcon />
              </IconButton>
            </Tooltip>
          )}

          {quote.status === 'SENT' && (
            <>
              <Tooltip title="Accepter">
                <IconButton 
                  size="small" 
                  color="success"
                  onClick={() => handleAcceptQuote(quote)}
                >
                  <AcceptIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Rejeter">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleRejectQuote(quote)}
                >
                  <RejectIcon />
                </IconButton>
              </Tooltip>
            </>
          )}

          {quote.status === 'ACCEPTED' && (
            <Tooltip title="Voir la facture">
              <IconButton 
                size="small" 
                color="secondary"
                onClick={() => handleConvertToInvoice(quote)}
              >
                <ConvertIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Supprimer">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => {
                setQuoteToDelete(quote);
                setDeleteDialogOpen(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: financePagePadding }}>
      <PageHeader
        title="Devis"
        subtitle="Propositions commerciales et suivi des conversions"
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={financePrimaryButtonSx}
          >
            Nouveau devis
          </Button>
        }
      />

      <Card sx={{ mb: 3, ...financeCardSx }}>
        <CardContent sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: '4fr 3fr 2fr 2fr' },
            alignItems: 'center'
          }}
        >
          <TextField
            fullWidth
            placeholder="Rechercher un devis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />

          <FormControl fullWidth>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | '')}
              label="Statut"
            >
              <MenuItem value="">Tous</MenuItem>
              <MenuItem value="DRAFT">Brouillon</MenuItem>
              <MenuItem value="SENT">Envoyé</MenuItem>
              <MenuItem value="ACCEPTED">Accepté</MenuItem>
              <MenuItem value="REJECTED">Rejeté</MenuItem>
              <MenuItem value="EXPIRED">Expiré</MenuItem>
            </Select>
          </FormControl>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtres
          </Button>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => quotesStore.fetchQuotes()}
            disabled={quotesStore.isLoading}
          >
            Actualiser
          </Button>
        </Box>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h6" color="primary">
            {quotesStore.quotes.length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total devis
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h6" color="success.main">
            {quotesStore.quotes.filter(q => q.status === 'ACCEPTED').length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Acceptés
          </Typography>
        </Paper>
        
        <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
          <Typography variant="h6" color="warning.main">
            {quotesStore.quotes.filter(q => q.status === 'SENT').length}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            En attente
          </Typography>
        </Paper>
      </Box>

      {/* Table */}
      {quotesStore.isLoading ? (
        <Box>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={60} sx={{ mb: 1 }} />
          ))}
        </Box>
      ) : quotesStore.quotes.length === 0 ? (
        <Alert severity="info">
          Aucun devis trouvé. Créez votre premier devis pour commencer.
        </Alert>
      ) : (
        <DataTable
          data={quotesStore.quotes}
          columns={columns}
          loading={quotesStore.isLoading}
        />
      )}

      {/* Dialog de confirmation suppression */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Supprimer le devis"
        message={`Êtes-vous sûr de vouloir supprimer le devis "${quoteToDelete?.number}" ?`}
        onConfirm={handleDeleteQuote}
        onClose={() => {
          setDeleteDialogOpen(false);
          setQuoteToDelete(null);
        }}
      />

      <CreateQuoteDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateQuote}
      />
    </Box>
  );
}


