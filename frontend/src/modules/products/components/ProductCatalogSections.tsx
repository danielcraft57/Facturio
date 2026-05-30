import { Box, Typography, Divider } from '@mui/material';
import type { MouseEvent } from 'react';
import type { Product } from '../../../types/product';
import { groupProductsBySection } from '../constants/danielCraftCatalog';
import { ProductCatalogGrid } from './ProductCatalogGrid';

type Props = {
  products: Product[];
  loading?: boolean;
  onMenu: (event: MouseEvent<HTMLElement>, product: Product) => void;
  onCardClick?: (product: Product) => void;
  mode?: 'catalog' | 'compact' | 'list';
  highlightProductId?: number | null;
};

export function ProductCatalogSections({ products, loading, onMenu, onCardClick, mode = 'catalog', highlightProductId }: Props) {
  if (loading) {
    return <ProductCatalogGrid products={[]} loading onMenu={onMenu} onCardClick={onCardClick} mode={mode} />;
  }

  const sections = groupProductsBySection(products);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: mode === 'compact' ? 2.5 : 4 }}>
      {sections.map(({ section, products: sectionProducts }, index) => (
        <Box key={`${section.id}-${index}`}>
          <Typography variant={mode === 'compact' ? 'subtitle1' : 'h6'} fontWeight={700} sx={{ mb: 0.5 }}>
            {section.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: mode === 'compact' ? 1.2 : 2 }}>
            {section.subtitle}
          </Typography>
          <ProductCatalogGrid
            products={sectionProducts}
            onMenu={onMenu}
            onCardClick={onCardClick}
            mode={mode}
            highlightProductId={highlightProductId}
          />
          {index < sections.length - 1 && <Divider sx={{ mt: mode === 'compact' ? 2.5 : 4 }} />}
        </Box>
      ))}
    </Box>
  );
}
