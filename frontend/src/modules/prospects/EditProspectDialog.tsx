import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Prospect, CreateProspectDto, UpdateProspectDto, CompanySize, BudgetRange, Priority } from '../../types/prospect';

interface EditProspectDialogProps {
  open: boolean;
  prospect: Prospect | null;
  onClose: () => void;
  onSave: (data: CreateProspectDto | UpdateProspectDto) => Promise<void>;
}

const companySizes = [
  { value: CompanySize.STARTUP, label: 'Startup' },
  { value: CompanySize.SMALL, label: 'Petite entreprise' },
  { value: CompanySize.MEDIUM, label: 'Moyenne entreprise' },
  { value: CompanySize.LARGE, label: 'Grande entreprise' },
  { value: CompanySize.ENTERPRISE, label: 'Entreprise' }
];

const budgetRanges = [
  { value: BudgetRange.LOW, label: '< 10k €' },
  { value: BudgetRange.MEDIUM, label: '10k - 50k €' },
  { value: BudgetRange.HIGH, label: '50k - 200k €' },
  { value: BudgetRange.ENTERPRISE, label: '> 200k €' }
];

const priorities = [
  { value: Priority.LOW, label: 'Faible' },
  { value: Priority.MEDIUM, label: 'Moyenne' },
  { value: Priority.HIGH, label: 'Élevée' },
  { value: Priority.URGENT, label: 'Urgente' }
];

export const EditProspectDialog: React.FC<EditProspectDialogProps> = ({
  open,
  prospect,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<CreateProspectDto>({
    companyName: '',
    industry: '',
    size: CompanySize.STARTUP,
    website: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'France',
    revenue: undefined,
    employees: undefined,
    description: '',
    painPoints: [],
    budget: BudgetRange.MEDIUM,
    decisionMaker: {
      name: '',
      position: '',
      email: '',
      phone: '',
      linkedin: ''
    },
    source: '',
    score: 50,
    priority: Priority.MEDIUM,
    assignedTo: '',
    notes: [],
    tags: []
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prospect) {
      setFormData({
        companyName: prospect.companyName,
        industry: prospect.industry,
        size: prospect.size,
        website: prospect.website || '',
        email: prospect.email || '',
        phone: prospect.phone || '',
        address: prospect.address || '',
        city: prospect.city || '',
        country: prospect.country,
        revenue: prospect.revenue,
        employees: prospect.employees,
        description: prospect.description || '',
        painPoints: prospect.painPoints || [],
        budget: prospect.budget || BudgetRange.MEDIUM,
        decisionMaker: prospect.decisionMaker ? {
          name: prospect.decisionMaker.name,
          position: prospect.decisionMaker.position,
          email: prospect.decisionMaker.email || '',
          phone: prospect.decisionMaker.phone || '',
          linkedin: prospect.decisionMaker.linkedin || ''
        } : {
          name: '',
          position: '',
          email: '',
          phone: '',
          linkedin: ''
        },
        source: prospect.source.id,
        score: prospect.score,
        priority: prospect.priority,
        assignedTo: prospect.assignedTo || '',
        notes: prospect.notes || [],
        tags: prospect.tags || []
      });
    }
  }, [prospect]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSave(formData);
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.companyName.trim() && formData.industry && formData.decisionMaker?.name.trim();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {prospect ? 'Modifier le prospect' : 'Nouveau prospect'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Box>
            <TextField
              fullWidth
              label="Nom de l'entreprise"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              required
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Industrie"
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              required
            />
          </Box>
          <Box>
            <FormControl fullWidth required>
              <InputLabel>Taille de l'entreprise</InputLabel>
              <Select
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value as CompanySize)}
                label="Taille de l'entreprise"
              >
                {Object.values(CompanySize).map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FormControl fullWidth>
              <InputLabel>Budget</InputLabel>
              <Select
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', e.target.value as BudgetRange)}
                label="Budget"
              >
                {Object.values(BudgetRange).map((budget) => (
                  <MenuItem key={budget} value={budget}>
                    {budget}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Site web"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              type="email"
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Nom du contact *"
              value={formData.decisionMaker?.name || ''}
              onChange={(e) => handleInputChange('decisionMaker', {
                ...formData.decisionMaker,
                name: e.target.value
              })}
              required
            />
          </Box>
          <Box>
            <TextField
              fullWidth
              label="Poste du contact *"
              value={formData.decisionMaker?.position || ''}
              onChange={(e) => handleInputChange('decisionMaker', {
                ...formData.decisionMaker,
                position: e.target.value
              })}
              required
            />
          </Box>
          <Box sx={{ gridColumn: { xs: 'auto', md: '1 / -1' } }}>
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={3}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Annuler
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isValid || loading}
        >
          {loading ? 'Sauvegarde...' : (prospect ? 'Mettre à jour' : 'Créer')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
