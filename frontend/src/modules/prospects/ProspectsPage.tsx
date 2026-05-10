import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Avatar,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Stack,
  Badge,
  Snackbar,
  Alert,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingUpIcon,
  PriorityHigh as PriorityHighIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useProspects } from '../../stores/prospectsStore';
import { Prospect, ProspectStatus, Priority, CompanySize, BudgetRange } from '../../types/prospect';
import { DataTable } from '../../components/DataTable';
import type { Column } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Toast } from '../../components/Toast';
import { EditProspectDialog } from './EditProspectDialog';
import { ProspectDetails } from './ProspectDetails';
import { prospectionService } from '../../services/prospectionService';

const DEFAULT_PROSPECTLAB_API_URL = 'https://prospectlab.danielcraft.fr';

/** Corrige une URL collée tronquée (ex. prospectlab.daniel → danielcraft.fr). */
function normalizeProspectLabApiUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return DEFAULT_PROSPECTLAB_API_URL;
  try {
    const href = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    const u = new URL(href);
    if (u.hostname === 'prospectlab.daniel') {
      u.hostname = 'prospectlab.danielcraft.fr';
    }
    return u.origin;
  } catch {
    return DEFAULT_PROSPECTLAB_API_URL;
  }
}

const statusColors: Record<ProspectStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  new: 'default',
  contacted: 'info',
  qualified: 'primary',
  proposal: 'warning',
  negotiation: 'secondary',
  closed_won: 'success',
  closed_lost: 'error',
  disqualified: 'error'
};

const priorityColors: Record<Priority, 'default' | 'primary' | 'secondary' | 'error'> = {
  low: 'default',
  medium: 'primary',
  high: 'secondary',
  urgent: 'error'
};

const sizeLabels: Record<CompanySize, string> = {
  startup: 'Startup',
  small: 'Petite',
  medium: 'Moyenne',
  large: 'Grande',
  enterprise: 'Entreprise'
};

const budgetLabels: Record<BudgetRange, string> = {
  low: '< 10k',
  medium: '10k - 50k',
  high: '50k - 200k',
  enterprise: '> 200k'
};

export const ProspectsPage: React.FC = () => {
  const {
    prospects,
    total,
    loading,
    error,
    filters,
    page,
    limit,
    setFilters,
    setPage,
    setLimit,
    fetchProspects,
    createProspect,
    updateProspect,
    deleteProspect,
    refreshProspects,
    getStats
  } = useProspects();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingProspect, setDeletingProspect] = useState<Prospect | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  // ProspectLab (API /api/prospection)
  const [prospectionConfig, setProspectionConfig] = useState<{ configured: boolean; hasToken?: boolean; apiUrl?: string; tokensUrl: string } | null>(null);
  const [prospectLabLoading, setProspectLabLoading] = useState(false);
  const [prospectLabError, setProspectLabError] = useState<string | null>(null);
  const [prospectLabData, setProspectLabData] = useState<{ data: Prospect[]; total: number }>({ data: [], total: 0 });
  const [prospectLabPage, setProspectLabPage] = useState(1);
  const [prospectLabLimit, setProspectLabLimit] = useState(20);
  const [prospectLabSearch, setProspectLabSearch] = useState('');
  const [showProspectLabConfig, setShowProspectLabConfig] = useState(false);
  const [prospectLabApiUrlDraft, setProspectLabApiUrlDraft] = useState(DEFAULT_PROSPECTLAB_API_URL);
  const [prospectLabApiKeyDraft, setProspectLabApiKeyDraft] = useState('');
  const [savingProspectLabConfig, setSavingProspectLabConfig] = useState(false);

  const useProspectLab = prospectionConfig?.configured ?? false;

  useEffect(() => {
    prospectionService.getConfig().then((c) => {
      setProspectionConfig(c);
      if (c?.apiUrl) setProspectLabApiUrlDraft(c.apiUrl);
      if (c.configured) {
        setProspectLabLoading(true);
        setProspectLabError(null);
        prospectionService
          .getProspects(1, 20)
          .then((r) => {
            setProspectLabData({ data: r.data, total: r.total });
            setProspectLabPage(1);
            setProspectLabLimit(20);
          })
          .catch((err) => setProspectLabError(err?.message || 'Erreur ProspectLab'))
          .finally(() => setProspectLabLoading(false));
      }
    });
  }, []);

  useEffect(() => {
    if (prospectionConfig !== null && !useProspectLab) {
      fetchProspects();
    }
  }, [fetchProspects, useProspectLab, prospectionConfig]);

  useEffect(() => {
    if (prospectionConfig !== null && !useProspectLab && filters) {
      fetchProspects();
    }
  }, [filters, page, limit, useProspectLab, prospectionConfig]);

  useEffect(() => {
    if (useProspectLab) {
      setProspectLabLoading(true);
      prospectionService
        .getProspects(prospectLabPage, prospectLabLimit, prospectLabSearch || undefined)
        .then((r) => setProspectLabData({ data: r.data, total: r.total }))
        .catch((err) => setProspectLabError(err?.message || 'Erreur ProspectLab'))
        .finally(() => setProspectLabLoading(false));
    }
  }, [useProspectLab, prospectLabPage, prospectLabLimit, prospectLabSearch]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (useProspectLab) {
      setProspectLabSearch(value);
      setProspectLabPage(1);
    } else if (value.length >= 2 || value.length === 0) {
      setFilters({ ...filters, search: value });
    }
  };

  const handleStatusFilter = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as ProspectStatus[] as unknown as string[]
    setFilters({ ...filters, status: value as any })
  };

  const handleIndustryFilter = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setFilters({ ...filters, industry: value });
  };

  const handlePriorityFilter = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as Priority[] as unknown as string[]
    setFilters({ ...filters, priority: value as any });
  };

  const handleCreateProspect = () => {
    setEditingProspect(null);
    setShowEditDialog(true);
  };

  const handleEditProspect = (prospect: Prospect) => {
    setEditingProspect(prospect);
    setShowEditDialog(true);
  };

  const handleDeleteProspect = (prospect: Prospect) => {
    setDeletingProspect(prospect);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProspect) return;
    
    try {
      await deleteProspect(deletingProspect.id);
      setToastMessage('Prospect supprimé avec succès');
      setToastSeverity('success');
      setShowToast(true);
      setShowDeleteDialog(false);
      setDeletingProspect(null);
    } catch (error) {
      setToastMessage('Erreur lors de la suppression');
      setToastSeverity('error');
      setShowToast(true);
    }
  };

  const handleSaveProspect = async (data: any) => {
    try {
      if (editingProspect) {
        await updateProspect(editingProspect.id, data);
        setToastMessage('Prospect mis à jour avec succès');
      } else {
        await createProspect(data);
        setToastMessage('Prospect créé avec succès');
      }
      setToastSeverity('success');
      setShowToast(true);
      setShowEditDialog(false);
      setEditingProspect(null);
      refreshProspects();
    } catch (error) {
      setToastMessage('Erreur lors de la sauvegarde');
      setToastSeverity('error');
      setShowToast(true);
    }
  };

  const stats = getStats();
  const displayProspects = useProspectLab ? prospectLabData.data : prospects;
  const displayTotal = useProspectLab ? prospectLabData.total : total;
  const displayLoading = prospectionConfig === null ? true : useProspectLab ? prospectLabLoading : loading;
  const displayPage = useProspectLab ? prospectLabPage : page;
  const displayLimit = useProspectLab ? prospectLabLimit : limit;
  const setDisplayPage = useProspectLab ? (p: number) => setProspectLabPage(p) : setPage;
  const setDisplayLimit = useProspectLab ? (n: number) => { setProspectLabLimit(n); setProspectLabPage(1); } : setLimit;
  const handleRefresh = useProspectLab
    ? () => {
        setProspectLabLoading(true);
        prospectionService
          .getProspects(prospectLabPage, prospectLabLimit, prospectLabSearch || undefined)
          .then((r) => setProspectLabData({ data: r.data, total: r.total }))
          .finally(() => setProspectLabLoading(false));
      }
    : refreshProspects;

  const isProspectLabRow = (p: Prospect) => p.source?.name === 'ProspectLab' || String(p.id).startsWith('pl-');

  const columns: Column<Prospect>[] = [
    {
      id: 'companyName',
      label: 'Entreprise',
      minWidth: 200,
      render: (prospect: Prospect) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
            <BusinessIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              {prospect.companyName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {prospect.industry}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Statut',
      minWidth: 120,
      render: (prospect: Prospect) => (
        <Chip
          label={prospect.status}
          color={statusColors[prospect.status]}
          size="small"
          variant="outlined"
        />
      )
    },
    {
      id: 'priority',
      label: 'Priorité',
      minWidth: 100,
      render: (prospect: Prospect) => (
        <Chip
          label={prospect.priority}
          color={priorityColors[prospect.priority]}
          size="small"
          icon={prospect.priority === 'urgent' ? <PriorityHighIcon /> : undefined}
        />
      )
    },
    {
      id: 'score',
      label: 'Score',
      minWidth: 80,
      render: (prospect: Prospect) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TrendingUpIcon color={prospect.score >= 80 ? 'success' : prospect.score >= 60 ? 'warning' : 'error'} />
          <Typography variant="body2" fontWeight="bold">
            {prospect.score}
          </Typography>
        </Box>
      )
    },
    {
      id: 'size',
      label: 'Taille',
      minWidth: 100,
      render: (prospect: Prospect) => (
        <Chip label={sizeLabels[prospect.size]} size="small" variant="outlined" />
      )
    },
    {
      id: 'budget',
      label: 'Budget',
      minWidth: 120,
      render: (prospect: Prospect) => (
        <Chip label={budgetLabels[prospect.budget || 'low']} size="small" variant="outlined" />
      )
    },
    {
      id: 'decisionMaker',
      label: 'Contact',
      minWidth: 200,
      render: (prospect: Prospect) => (
        <Box>
          {prospect.decisionMaker && (
            <Typography variant="body2" fontWeight="medium">
              {prospect.decisionMaker.name}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {prospect.decisionMaker?.position}
          </Typography>
        </Box>
      )
    },
    {
      id: 'nextFollowUp',
      label: 'Prochain contact',
      minWidth: 140,
      render: (prospect: Prospect) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ScheduleIcon fontSize="small" color="action" />
          <Typography variant="body2">
            {prospect.nextFollowUp ? new Date(prospect.nextFollowUp).toLocaleDateString('fr-FR') : 'Non planifié'}
          </Typography>
        </Box>
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      render: (prospect: Prospect) => {
        const readOnly = isProspectLabRow(prospect);
        return (
          <Box>
            <Tooltip title="Voir détails">
              <IconButton
                size="small"
                onClick={() => setSelectedProspect(prospect)}
                color="primary"
              >
                <BusinessIcon />
              </IconButton>
            </Tooltip>
            {!readOnly && (
              <>
                <Tooltip title="Modifier">
                  <IconButton
                    size="small"
                    onClick={() => handleEditProspect(prospect)}
                    color="secondary"
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Supprimer">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteProspect(prospect)}
                    color="error"
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        );
      }
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Bannière configuration ProspectLab */}
      {prospectionConfig && !prospectionConfig.configured && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Afficher les prospects depuis ProspectLab
          </Typography>
          <Typography variant="body2">
            Créez un token API sur{' '}
            <Link href={prospectionConfig.tokensUrl} target="_blank" rel="noopener noreferrer">
              {prospectionConfig.tokensUrl}
            </Link>
            , puis collez-le ci-dessous.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Utilise l’URL complète <strong>{DEFAULT_PROSPECTLAB_API_URL}</strong>. Coche sur ProspectLab les accès aux{' '}
            <strong>emails / contacts</strong> si tu veux les voir dans le détail d’une entreprise (sinon seules les infos « entreprise » sont visibles).
          </Typography>
          <Box
            component="form"
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' }, gap: 2, mt: 2, alignItems: 'center' }}
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSavingProspectLabConfig(true);
                const apiUrl = normalizeProspectLabApiUrl(prospectLabApiUrlDraft);
                setProspectLabApiUrlDraft(apiUrl);
                const updated = await prospectionService.updateConfig({
                  apiUrl,
                  apiKey: prospectLabApiKeyDraft || undefined
                });
                setProspectionConfig(updated);
                setProspectLabApiKeyDraft('');
                setProspectLabError(null);
                setProspectLabPage(1);
                setProspectLabLimit(20);
                setProspectLabSearch('');
                const r = await prospectionService.getProspects(1, 20);
                setProspectLabData({ data: r.data, total: r.total });
              } catch (err: any) {
                setProspectLabError(err?.message || 'Erreur sauvegarde ProspectLab');
              } finally {
                setSavingProspectLabConfig(false);
              }
            }}
          >
            <TextField
              label="URL API ProspectLab"
              value={prospectLabApiUrlDraft}
              onChange={(e) => setProspectLabApiUrlDraft(e.target.value)}
              placeholder={DEFAULT_PROSPECTLAB_API_URL}
              size="small"
              fullWidth
              name="prospectlab-api-url"
              autoComplete="url"
            />
            <TextField
              label="Token API (Bearer)"
              value={prospectLabApiKeyDraft}
              onChange={(e) => setProspectLabApiKeyDraft(e.target.value)}
              placeholder="Collez votre token"
              size="small"
              fullWidth
              type="password"
              name="prospectlab-api-token"
              autoComplete="new-password"
              inputProps={{ autoComplete: 'new-password' }}
            />
            <Button type="submit" variant="contained" disabled={savingProspectLabConfig}>
              Enregistrer
            </Button>
          </Box>
        </Alert>
      )}

      {useProspectLab && prospectLabError && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setProspectLabError(null)}>
          {prospectLabError}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Prospection
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {useProspectLab ? 'Prospects ProspectLab' : 'Gestion des prospects et pipeline commercial'}
          </Typography>
          {useProspectLab && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Chip label="Source : ProspectLab" size="small" color="primary" variant="outlined" />
              <Button size="small" variant="text" onClick={() => setShowProspectLabConfig(v => !v)}>
                Configurer
              </Button>
            </Box>
          )}
        </Box>
        {!useProspectLab && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProspect}
            size="large"
          >
            Nouveau Prospect
          </Button>
        )}
      </Box>

      {useProspectLab && showProspectLabConfig && prospectionConfig && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Configuration ProspectLab
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Le token est enregistré côté serveur pour ton organisation (il n’est pas renvoyé au navigateur).
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Permissions ProspectLab : pour les contacts détaillés, active aussi « emails » (ou équivalent) sur le token.
          </Typography>
          <Box
            component="form"
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' }, gap: 2, alignItems: 'center' }}
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                setSavingProspectLabConfig(true);
                const apiUrl = normalizeProspectLabApiUrl(prospectLabApiUrlDraft);
                setProspectLabApiUrlDraft(apiUrl);
                const updated = await prospectionService.updateConfig({
                  apiUrl,
                  apiKey: prospectLabApiKeyDraft || undefined
                });
                setProspectionConfig(updated);
                setProspectLabApiKeyDraft('');
                setProspectLabError(null);
                handleRefresh();
              } catch (err: any) {
                setProspectLabError(err?.message || 'Erreur sauvegarde ProspectLab');
              } finally {
                setSavingProspectLabConfig(false);
              }
            }}
          >
            <TextField
              label="URL API ProspectLab"
              value={prospectLabApiUrlDraft}
              onChange={(e) => setProspectLabApiUrlDraft(e.target.value)}
              size="small"
              fullWidth
              name="prospectlab-api-url-2"
              autoComplete="url"
            />
            <TextField
              label={prospectionConfig.hasToken ? 'Token (déjà configuré) — recoller pour remplacer' : 'Token API (Bearer)'}
              value={prospectLabApiKeyDraft}
              onChange={(e) => setProspectLabApiKeyDraft(e.target.value)}
              size="small"
              fullWidth
              type="password"
              name="prospectlab-api-token-2"
              autoComplete="new-password"
              inputProps={{ autoComplete: 'new-password' }}
            />
            <Button type="submit" variant="contained" disabled={savingProspectLabConfig}>
              Sauvegarder
            </Button>
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Créer/renouveler un token :{' '}
            <Link href={prospectionConfig.tokensUrl} target="_blank" rel="noopener noreferrer">
              {prospectionConfig.tokensUrl}
            </Link>
          </Typography>
        </Paper>
      )}

      {/* Statistiques */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Prospects
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {useProspectLab ? displayTotal : stats.total}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Qualifiés
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {useProspectLab ? 0 : (stats.byStatus.qualified || 0)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              En négociation
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="warning">
              {useProspectLab ? 0 : (stats.byStatus.negotiation || 0)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Gagnés
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success">
              {useProspectLab ? 0 : (stats.byStatus.closed_won || 0)}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filtres et recherche */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 2, alignItems: 'center' }}>
          <TextField
            fullWidth
            placeholder="Rechercher une entreprise..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 120 }} disabled={useProspectLab}>
              <InputLabel>Statut</InputLabel>
              <Select
                multiple
                value={filters.status || []}
                onChange={handleStatusFilter}
                label="Statut"
              >
                {Object.values(ProspectStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }} disabled={useProspectLab}>
              <InputLabel>Industrie</InputLabel>
              <Select
                multiple
                value={filters.industry || []}
                onChange={handleIndustryFilter}
                label="Industrie"
              >
                {Array.from(new Set(displayProspects.map(p => p.industry).filter(Boolean))).map((industry) => (
                  <MenuItem key={industry} value={industry}>
                    {industry}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }} disabled={useProspectLab}>
              <InputLabel>Priorité</InputLabel>
              <Select
                multiple
                value={filters.priority || []}
                onChange={handlePriorityFilter}
                label="Priorité"
              >
                {Object.values(Priority).map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={displayLoading}
            >
              Actualiser
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Table des prospects */}
      <Paper sx={{ width: '100%' }}>
        <DataTable
          data={displayProspects}
          columns={columns}
          loading={displayLoading}
          total={displayTotal}
          page={displayPage - 1}
          rowsPerPage={displayLimit}
          rowsPerPageOptions={[5, 10, 20, 25, 50]}
          onPageChange={(p) => setDisplayPage(p + 1)}
          onRowsPerPageChange={(n) => setDisplayLimit(n)}
          getRowId={(row) => row.id}
        />
      </Paper>

      {/* Dialogs */}
      <EditProspectDialog
        open={showEditDialog}
        prospect={editingProspect}
        onClose={() => {
          setShowEditDialog(false);
          setEditingProspect(null);
        }}
        onSave={handleSaveProspect}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        title="Supprimer le prospect"
        message={`Êtes-vous sûr de vouloir supprimer le prospect "${deletingProspect?.companyName}" ?`}
        onConfirm={handleConfirmDelete}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingProspect(null);
        }}
      />

      <ProspectDetails
        prospect={selectedProspect}
        open={!!selectedProspect}
        onClose={() => setSelectedProspect(null)}
        onEdit={handleEditProspect}
      />

      {/* Toast */}
      {/* Simplification: utiliser Snackbar local au lieu du composant Toast typé */}
      <Snackbar
        open={showToast}
        autoHideDuration={4000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: 8 }}
      >
        <Alert onClose={() => setShowToast(false)} severity={toastSeverity} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
