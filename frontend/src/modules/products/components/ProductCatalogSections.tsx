import { Box, Typography, Divider } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons';
import type { MouseEvent } from 'react';
import type { Product } from '../../../types/product';
import { groupProductsBySection } from '../constants/danielCraftCatalog';
import { ProductCatalogGrid } from './ProductCatalogGrid';

type Props = {
  products: Product[];
  loading?: boolean;
  onMenu: (event: MouseEvent<HTMLElement>, product: Product) => void;
  onCardClick?: (product: Product) => void;
};

export function ProductCatalogSections({ products, loading, onMenu, onCardClick }: Props) {
  if (loading) {
    return <ProductCatalogGrid products={[]} loading onMenu={onMenu} onCardClick={onCardClick} />;
  }

  const sections = groupProductsBySection(products);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 2,
          borderRadius: 2,
          bgcolor: 'action.hover',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <FontAwesomeIcon icon={faGlobe} style={{ opacity: 0.7 }} />
        <Box>
          <Typography variant="body2" fontWeight={600}>
            Catalogue DanielCraft
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Tarifs indicatifs alignés sur{' '}
            <Box
              component="a"
              href="https://danielcraft.fr/autres-prestations"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main' }}
            >
              danielcraft.fr/autres-prestations
            </Box>
          </Typography>
        </Box>
      </Box>

      {sections.map(({ section, products: sectionProducts }, index) => (
        <Box key={section.id}>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
            {section.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {section.subtitle}
          </Typography>
          <ProductCatalogGrid
            products={sectionProducts}
            onMenu={onMenu}
            onCardClick={onCardClick}
          />
          {index < sections.length - 1 && <Divider sx={{ mt: 4 }} />}
        </Box>
      ))}
    </Box>
  );
}
