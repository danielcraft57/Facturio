import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  IconButton
} from '@mui/material';
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingUpIcon,
  PriorityHigh as PriorityHighIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Work as WorkIcon
} from '@mui/icons-material';
import { Prospect, ProspectStatus, Priority, CompanySize, BudgetRange } from '../../types/prospect';

interface ProspectDetailsProps {
  prospect: Prospect | null;
  open: boolean;
  onClose: () => void;
  onEdit: (prospect: Prospect) => void;
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
  small: 'Petite entreprise',
  medium: 'Moyenne entreprise',
  large: 'Grande entreprise',
  enterprise: 'Entreprise'
};

const budgetLabels: Record<BudgetRange, string> = {
  low: '< 10k €',
  medium: '10k - 50k €',
  high: '50k - 200k €',
  enterprise: '> 200k €'
};

export const ProspectDetails: React.FC<ProspectDetailsProps> = ({
  prospect,
  open,
  onClose,
  onEdit
}) => {
  if (!prospect) return null;

  const handleEdit = () => {
    onEdit(prospect);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={prospect.status}
              color={statusColors[prospect.status]}
              variant="outlined"
              size="medium"
            />
            <Chip
              label={prospect.priority}
              color={priorityColors[prospect.priority]}
              icon={prospect.priority === 'urgent' ? <PriorityHighIcon /> : undefined}
              size="medium"
            />
            <Chip
              label={`Score: ${prospect.score}`}
              color={prospect.score >= 80 ? 'success' : prospect.score >= 60 ? 'warning' : 'error'}
              icon={<TrendingUpIcon />}
              size="medium"
            />
          </Box>
          <Box>
            <IconButton onClick={handleEdit} color="primary" sx={{ mr: 1 }}>
              <EditIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 3 }}>
          {/* Statut et priorité */}
          <Box>
            <Box display="flex" gap={2} mb={2}>
              <Chip
                label={prospect.status}
                color={statusColors[prospect.status]}
                variant="outlined"
                size="medium"
              />
              <Chip
                label={prospect.priority}
                color={priorityColors[prospect.priority]}
                icon={prospect.priority === 'urgent' ? <PriorityHighIcon /> : undefined}
                size="medium"
              />
              <Chip
                label={`Score: ${prospect.score}`}
                color={prospect.score >= 80 ? 'success' : prospect.score >= 60 ? 'warning' : 'error'}
                icon={<TrendingUpIcon />}
                size="medium"
              />
            </Box>
          </Box>

          {/* Informations de base et Contact */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Informations de base
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <WorkIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Taille"
                    secondary={sizeLabels[prospect.size]}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUpIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Budget"
                    secondary={budgetLabels[prospect.budget || 'low']}
                  />
                </ListItem>
                {prospect.revenue && (
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Chiffre d'affaires"
                      secondary={`${prospect.revenue.toLocaleString('fr-FR')} €`}
                    />
                  </ListItem>
                )}
                {prospect.employees && (
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Employés"
                      secondary={prospect.employees}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Contact principal
              </Typography>
              {prospect.decisionMaker && (
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <PersonIcon color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={prospect.decisionMaker.name}
                      secondary={prospect.decisionMaker.position}
                    />
                  </ListItem>
                  {prospect.decisionMaker.email && (
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={prospect.decisionMaker.email}
                      />
                    </ListItem>
                  )}
                  {prospect.decisionMaker.phone && (
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Téléphone"
                        secondary={prospect.decisionMaker.phone}
                      />
                    </ListItem>
                  )}
                  {prospect.decisionMaker.linkedin && (
                    <ListItem>
                      <ListItemIcon>
                        <LanguageIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary="LinkedIn"
                        secondary={prospect.decisionMaker.linkedin}
                      />
                    </ListItem>
                  )}
                </List>
              )}
            </Paper>
          </Box>

          {/* Coordonnées */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Coordonnées
            </Typography>
            <List dense>
              {prospect.website && (
                <ListItem>
                  <ListItemIcon>
                    <LanguageIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Site web"
                    secondary={
                      <a href={prospect.website} target="_blank" rel="noopener noreferrer">
                        {prospect.website}
                      </a>
                    }
                  />
                </ListItem>
              )}
              {prospect.email && (
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={prospect.email}
                  />
                </ListItem>
              )}
              {prospect.phone && (
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Téléphone"
                    secondary={prospect.phone}
                  />
                </ListItem>
              )}
              {(prospect.address || prospect.city) && (
                <ListItem>
                  <ListItemIcon>
                    <LocationIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Adresse"
                    secondary={`${prospect.address || ''} ${prospect.city || ''} ${prospect.country}`}
                  />
                </ListItem>
              )}
            </List>
          </Paper>

          {/* Description */}
          {prospect.description && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {prospect.description}
              </Typography>
            </Paper>
          )}

          {/* Points de douleur et Notes */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {prospect.painPoints && prospect.painPoints.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Points de douleur
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {prospect.painPoints.map((point, index) => (
                    <Chip
                      key={index}
                      label={point}
                      size="small"
                      variant="outlined"
                      color="error"
                    />
                  ))}
                </Box>
              </Paper>
            )}

            {prospect.notes && prospect.notes.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <List dense>
                  {prospect.notes.map((note, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={note}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {/* Tags */}
          {prospect.tags && prospect.tags.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Tags
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {prospect.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* Dates */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Informations temporelles
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Créé le : {new Date(prospect.createdAt).toLocaleDateString('fr-FR')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Modifié le : {new Date(prospect.updatedAt).toLocaleDateString('fr-FR')}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          Fermer
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={handleEdit}
        >
          Modifier
        </Button>
      </DialogActions>
    </Dialog>
  );
};
