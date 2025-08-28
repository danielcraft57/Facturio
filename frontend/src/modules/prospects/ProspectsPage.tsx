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
  Alert
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

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  useEffect(() => {
    if (filters) {
      fetchProspects();
    }
  }, [filters, page, limit]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // Recherche en temps réel
    if (event.target.value.length >= 2 || event.target.value.length === 0) {
      setFilters({ ...filters, search: event.target.value });
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
      render: (prospect: Prospect) => (
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
        </Box>
      )
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Prospection
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestion des prospects et pipeline commercial
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateProspect}
          size="large"
        >
          Nouveau Prospect
        </Button>
      </Box>

      {/* Statistiques */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Total Prospects
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Qualifiés
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="primary">
              {stats.byStatus.qualified || 0}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              En négociation
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="warning">
              {stats.byStatus.negotiation || 0}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Gagnés
            </Typography>
            <Typography variant="h4" fontWeight="bold" color="success">
              {stats.byStatus.closed_won || 0}
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
            <FormControl size="small" sx={{ minWidth: 120 }}>
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

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Industrie</InputLabel>
              <Select
                multiple
                value={filters.industry || []}
                onChange={handleIndustryFilter}
                label="Industrie"
              >
                {Array.from(new Set(prospects.map(p => p.industry))).map((industry) => (
                  <MenuItem key={industry} value={industry}>
                    {industry}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
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
              onClick={refreshProspects}
              disabled={loading}
            >
              Actualiser
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Table des prospects */}
      <Paper sx={{ width: '100%' }}>
        <DataTable
          data={prospects}
          columns={columns}
          loading={loading}
          total={total}
          page={page - 1}
          rowsPerPage={limit}
          rowsPerPageOptions={[5, 10, 20, 25, 50]}
          onPageChange={(p) => setPage(p + 1)}
          onRowsPerPageChange={(n) => setLimit(n)}
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
