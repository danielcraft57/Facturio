import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { ProductCategory, ProductKind, ProductPurpose } from '../../../types/product';
import {
  CATEGORY_GROUPS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  KIND_ICONS,
  KIND_LABELS,
  PRODUCT_KINDS,
  PURPOSE_GROUPS,
  PURPOSE_ICONS,
  PURPOSE_LABELS,
} from '../constants/productLabels';
import { SelectionCard } from './SelectionCard';

type Props = {
  kind: ProductKind;
  purpose: ProductPurpose | '';
  category: ProductCategory | '';
  onKindChange: (kind: ProductKind) => void;
  onPurposeChange: (purpose: ProductPurpose | '') => void;
  onCategoryChange: (category: ProductCategory | '') => void;
  kindError?: string;
};

function SelectionGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
        gap: 1,
      }}
    >
      {children}
    </Box>
  );
}

export function ProductClassificationField({
  kind,
  purpose,
  category,
  onKindChange,
  onPurposeChange,
  onCategoryChange,
  kindError,
}: Props) {
  const [expanded, setExpanded] = useState<string | false>('kind');

  const summaryChips = useMemo(() => {
    const chips: string[] = [KIND_LABELS[kind]];
    if (purpose) chips.push(PURPOSE_LABELS[purpose]);
    if (category) chips.push(CATEGORY_LABELS[category]);
    return chips;
  }, [kind, purpose, category]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'action.hover',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Sélection actuelle
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.75}>
          {summaryChips.map(label => (
            <Chip key={label} size="small" label={label} color="primary" variant="outlined" />
          ))}
        </Stack>
      </Box>

      <Accordion
        expanded={expanded === 'kind'}
        onChange={(_, isExpanded) => setExpanded(isExpanded ? 'kind' : false)}
        disableGutters
        elevation={0}
        sx={{ border: 1, borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box>
            <Typography variant="subtitle2">Type de produit</Typography>
            <Typography variant="caption" color="text.secondary">
              {KIND_LABELS[kind]}
              {kindError ? ` — ${kindError}` : ''}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <SelectionGrid>
            {PRODUCT_KINDS.map(k => (
              <SelectionCard
                key={k}
                label={KIND_LABELS[k]}
                icon={KIND_ICONS[k]}
                selected={kind === k}
                onClick={() => onKindChange(k)}
              />
            ))}
          </SelectionGrid>
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'purpose'}
        onChange={(_, isExpanded) => setExpanded(isExpanded ? 'purpose' : false)}
        disableGutters
        elevation={0}
        sx={{ border: 1, borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box>
            <Typography variant="subtitle2">But / usage</Typography>
            <Typography variant="caption" color="text.secondary">
              {purpose ? PURPOSE_LABELS[purpose] : 'Optionnel — précise le contexte client'}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SelectionGrid>
            <SelectionCard label="Non défini" selected={!purpose} onClick={() => onPurposeChange('')} />
          </SelectionGrid>
          {PURPOSE_GROUPS.map(group => (
            <Box key={group.id}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
                {group.label}
              </Typography>
              <SelectionGrid>
                {group.items.map(p => (
                  <SelectionCard
                    key={p}
                    label={PURPOSE_LABELS[p]}
                    icon={PURPOSE_ICONS[p]}
                    selected={purpose === p}
                    onClick={() => onPurposeChange(p)}
                  />
                ))}
              </SelectionGrid>
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>

      <Accordion
        expanded={expanded === 'category'}
        onChange={(_, isExpanded) => setExpanded(isExpanded ? 'category' : false)}
        disableGutters
        elevation={0}
        sx={{ border: 1, borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box>
            <Typography variant="subtitle2">Catégorie métier</Typography>
            <Typography variant="caption" color="text.secondary">
              {category ? CATEGORY_LABELS[category] : 'Optionnel — filtre votre catalogue'}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflowY: 'auto' }}>
          <SelectionGrid>
            <SelectionCard label="—" selected={!category} onClick={() => onCategoryChange('')} />
          </SelectionGrid>
          {CATEGORY_GROUPS.map(group => (
            <Box key={group.id}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
                {group.label}
              </Typography>
              <SelectionGrid>
                {group.items.map(c => (
                  <SelectionCard
                    key={c}
                    label={CATEGORY_LABELS[c]}
                    icon={CATEGORY_ICONS[c]}
                    selected={category === c}
                    onClick={() => onCategoryChange(c)}
                  />
                ))}
              </SelectionGrid>
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
