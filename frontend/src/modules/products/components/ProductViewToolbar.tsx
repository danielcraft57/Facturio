import {
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIcons, faImages, faPaintbrush } from '@fortawesome/free-solid-svg-icons';
import type { ProductVisualType } from '../../../types/product';

export type ProductViewMode = 'table' | 'catalog';

type Props = {
  viewMode: ProductViewMode;
  onViewModeChange: (mode: ProductViewMode) => void;
  visualType: ProductVisualType | '';
  onVisualTypeChange: (type: ProductVisualType | '') => void;
};

export function ProductViewToolbar({ viewMode, onViewModeChange, visualType, onVisualTypeChange }: Props) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        size="small"
        onChange={(_, v) => v && onViewModeChange(v)}
        aria-label="Mode d'affichage"
      >
        <ToggleButton value="catalog" aria-label="Catalogue">
          <ViewModuleIcon fontSize="small" sx={{ mr: 0.75 }} />
          Catalogue
        </ToggleButton>
        <ToggleButton value="table" aria-label="Liste">
          <ViewListIcon fontSize="small" sx={{ mr: 0.75 }} />
          Liste
        </ToggleButton>
      </ToggleButtonGroup>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Type de visuel</InputLabel>
        <Select
          label="Type de visuel"
          value={visualType}
          onChange={e => onVisualTypeChange(e.target.value as ProductVisualType | '')}
        >
          <MenuItem value="">Tous</MenuItem>
          <MenuItem value="icon">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FontAwesomeIcon icon={faIcons} /> Icônes
            </Box>
          </MenuItem>
          <MenuItem value="library">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FontAwesomeIcon icon={faImages} /> Bibliothèque
            </Box>
          </MenuItem>
          <MenuItem value="custom">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FontAwesomeIcon icon={faPaintbrush} /> Image personnalisée
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
