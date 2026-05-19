import type { MouseEvent } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
  Stack,
  Tooltip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faDownload } from '@fortawesome/free-solid-svg-icons';
import type { Product } from '../../../types/product';
import { ProductAvatar } from './ProductAvatar';
import { PURPOSE_LABELS, CATEGORY_LABELS, KIND_LABELS } from '../constants/productLabels';
import { resolveProductImageUrl } from '../utils/productVisual';
import { downloadDataUrl } from '../utils/generateProductImage';

type Props = {
  product: Product;
  onMenu: (event: MouseEvent<HTMLElement>, product: Product) => void;
  onClick?: (product: Product) => void;
};

export function ProductCatalogCard({ product, onMenu, onClick }: Props) {
  const imageUrl = resolveProductImageUrl(product);
  const price = Number(product.unitPrice ?? 0);
  const details = (product.details || []).slice(0, 3);

  const handleDownload = (e: MouseEvent) => {
    e.stopPropagation();
    if (imageUrl) downloadDataUrl(imageUrl, `${product.name.replace(/\s+/g, '-').toLowerCase()}.png`);
  };

  return (
    <Card
      elevation={0}
      onClick={() => onClick?.(product)}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        transition: 'box-shadow 0.2s, transform 0.15s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: theme => theme.shadows[4],
            }
          : {},
      }}
    >
      <Box
        sx={{
          position: 'relative',
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: imageUrl ? 'transparent' : 'primary.main',
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '12px 12px 0 0',
        }}
      >
        {!imageUrl && (
          <ProductAvatar product={product} size={72} />
        )}
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'background.paper',
            opacity: 0.92,
            '&:hover': { bgcolor: 'background.paper' },
          }}
          onClick={e => {
            e.stopPropagation();
            onMenu(e, product);
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        {imageUrl && (
          <Tooltip title="Télécharger l'image">
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                bgcolor: 'background.paper',
                opacity: 0.92,
              }}
              onClick={handleDownload}
            >
              <FontAwesomeIcon icon={faDownload} style={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <CardContent sx={{ flex: 1, pt: 1.5, pb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} noWrap title={product.name}>
          {product.name}
        </Typography>
        {product.sku && (
          <Typography variant="caption" color="text.secondary" display="block">
            {product.sku}
          </Typography>
        )}
        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
          <Chip size="small" label={KIND_LABELS[product.kind]} />
          {product.purpose && (
            <Chip size="small" color="primary" variant="outlined" label={PURPOSE_LABELS[product.purpose]} />
          )}
          {product.category && (
            <Chip size="small" variant="outlined" label={CATEGORY_LABELS[product.category]} />
          )}
        </Stack>
        {product.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.description}
          </Typography>
        )}
        {details.length > 0 && (
          <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, color: 'text.secondary' }}>
            {details.map((d, i) => (
              <Typography key={i} component="li" variant="caption">
                {d}
              </Typography>
            ))}
          </Box>
        )}
        {product.languages && product.languages.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
            {product.languages.slice(0, 4).map(lang => (
              <Chip key={lang} label={lang} size="small" variant="outlined" sx={{ height: 22 }} />
            ))}
          </Stack>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
        <Typography variant="h6" color="primary.main" fontWeight={800}>
          {price.toFixed(2)} €
        </Typography>
        {Number(product.estimatedHours) > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <FontAwesomeIcon icon={faClock} style={{ fontSize: 12 }} />
            <Typography variant="caption">{product.estimatedHours} h</Typography>
          </Box>
        )}
      </CardActions>
    </Card>
  );
}
