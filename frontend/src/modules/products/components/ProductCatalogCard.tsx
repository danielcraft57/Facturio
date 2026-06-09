import { useEffect, useState, type MouseEvent } from 'react';
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
import type { RealtimeHighlightTone } from '../../../types/realtime';
import { getRealtimeRowSx } from '../../../utils/realtimeRowHighlight';
import { ProductAvatar } from './ProductAvatar';
import { PURPOSE_LABELS, CATEGORY_LABELS, KIND_LABELS } from '../constants/productLabels';
import { ProductTechStackChips } from './ProductTechStackChips';
import { resolveProductImageUrl, getProductIconGradientCss } from '../utils/productVisual';
import { withProductVisualFallback } from '../utils/productVisualFallback';
import { downloadDataUrl } from '../utils/generateProductImage';

type Props = {
  product: Product;
  onMenu: (event: MouseEvent<HTMLElement>, product: Product) => void;
  onClick?: (product: Product) => void;
  mode?: 'catalog' | 'compact' | 'list';
  highlight?: boolean;
  highlightTone?: RealtimeHighlightTone;
};

export function ProductCatalogCard({
  product,
  onMenu,
  onClick,
  mode = 'catalog',
  highlight = false,
  highlightTone,
}: Props) {
  const displayProduct = withProductVisualFallback(product);
  const imageUrl = resolveProductImageUrl(displayProduct);
  const iconGradient = getProductIconGradientCss(displayProduct);
  const [imageBroken, setImageBroken] = useState(false);
  const price = Number(product.unitPrice ?? 0);
  const details = (product.details || []).slice(0, mode === 'catalog' ? 3 : mode === 'compact' ? 1 : 2);
  const showVisualImage = Boolean(imageUrl && !imageBroken);
  const isList = mode === 'list';
  const isCompact = mode === 'compact';
  const rowTone: RealtimeHighlightTone | undefined = highlight ? (highlightTone ?? 'created') : undefined;

  useEffect(() => {
    setImageBroken(false);
  }, [product.id, imageUrl]);

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
        flexDirection: isList ? 'row' : 'column',
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid',
        borderColor: highlight ? 'success.main' : 'divider',
        borderRadius: 2.5,
        transition: 'box-shadow 0.25s ease, transform 0.2s ease, border-color 0.35s ease',
        ...getRealtimeRowSx(rowTone),
        '&:hover': onClick
          ? {
              transform: highlight ? undefined : 'translateY(-2px)',
              boxShadow: theme => theme.shadows[4],
            }
          : {},
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: isList ? 180 : '100%',
          minWidth: isList ? 180 : undefined,
          height: isList ? 128 : isCompact ? 92 : 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: showVisualImage || iconGradient ? 'transparent' : 'primary.main',
          background: !showVisualImage && iconGradient ? iconGradient : undefined,
          borderRadius: isList ? '12px 0 0 12px' : '12px 12px 0 0',
          overflow: 'hidden',
        }}
      >
        {showVisualImage && (
          <Box
            component="img"
            src={imageUrl}
            alt={product.name}
            onError={() => setImageBroken(true)}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        {!showVisualImage && (
          <ProductAvatar product={displayProduct} size={isCompact ? 52 : 72} />
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
        {showVisualImage && (
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

      <CardContent sx={{ flex: 1, pt: isCompact ? 1 : 1.5, pb: isCompact ? 0.6 : 1 }}>
        <Typography variant={isCompact ? 'body1' : 'subtitle1'} fontWeight={700} noWrap title={product.name}>
          {product.name}
        </Typography>
        {product.sku && (
          <Typography variant="caption" color="text.secondary" display="block">
            {product.sku}
          </Typography>
        )}
        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: isCompact ? 0.6 : 1 }}>
          <Chip size="small" label={KIND_LABELS[product.kind]} />
          {!isCompact && product.purpose && (
            <Chip size="small" color="primary" variant="outlined" label={PURPOSE_LABELS[product.purpose]} />
          )}
          {!isCompact && product.category && (
            <Chip size="small" variant="outlined" label={CATEGORY_LABELS[product.category]} />
          )}
        </Stack>
        {product.description && (
          <Typography
            variant={isCompact ? 'caption' : 'body2'}
            color="text.secondary"
            sx={{
              mt: isCompact ? 0.6 : 1,
              display: '-webkit-box',
              WebkitLineClamp: isList ? 3 : isCompact ? 1 : 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.description}
          </Typography>
        )}
        {details.length > 0 && !isCompact && (
          <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5, color: 'text.secondary' }}>
            {details.map((d, i) => (
              <Typography key={i} component="li" variant="caption">
                {d.label}
              </Typography>
            ))}
          </Box>
        )}
        {!isCompact && (
          <ProductTechStackChips
            techStack={product.techStack}
            languages={product.languages}
            maxPerCategory={isList ? 2 : 3}
          />
        )}
      </CardContent>

      <CardActions sx={{ px: isCompact ? 1.2 : 2, pb: isCompact ? 1.1 : 2, pt: 0, justifyContent: 'space-between' }}>
        <Typography variant={isCompact ? 'subtitle1' : 'h6'} color="primary.main" fontWeight={800}>
          {Math.round(price)} €
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
