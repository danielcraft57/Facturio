import type { MouseEvent } from 'react';
import { Grid, Skeleton, Typography, Alert } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import type { Product } from '../../../types/product';
import { ProductCatalogCard } from './ProductCatalogCard';

type Props = {
  products: Product[];
  loading?: boolean;
  onMenu: (event: MouseEvent<HTMLElement>, product: Product) => void;
  onCardClick?: (product: Product) => void;
  mode?: 'catalog' | 'compact' | 'list';
};

export function ProductCatalogGrid({ products, loading, onMenu, onCardClick, mode = 'catalog' }: Props) {
  if (loading) {
    return (
      <Grid container spacing={2}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Skeleton variant="rounded" height={320} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (products.length === 0) {
    return (
      <Alert
        severity="info"
        icon={<FontAwesomeIcon icon={faBoxOpen} />}
        sx={{ borderRadius: 2 }}
      >
        <Typography variant="subtitle2">Aucun produit</Typography>
        <Typography variant="body2">Ajustez les filtres ou créez votre premier produit.</Typography>
      </Alert>
    );
  }

  return (
    <Grid container spacing={mode === 'compact' ? 1.2 : 2}>
      {products.map(product => (
        <Grid
          key={product.id}
          size={
            mode === 'list'
              ? { xs: 12 }
              : mode === 'compact'
                ? { xs: 12, sm: 6, md: 4, lg: 2 }
                : { xs: 12, sm: 6, md: 4, lg: 3 }
          }
        >
          <ProductCatalogCard product={product} onMenu={onMenu} onClick={onCardClick} mode={mode} />
        </Grid>
      ))}
    </Grid>
  );
}
