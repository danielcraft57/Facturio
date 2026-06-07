import { Avatar, Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { Product } from '../../../types/product';
import { getIconByName } from '../constants/productIconOptions';
import { getProductIconGradientCss, resolveProductImageUrl } from '../utils/productVisual';

type Props = {
  product: Pick<Product, 'name' | 'visualType' | 'iconName' | 'imageData'>;
  size?: number;
};

export function ProductAvatar({ product, size = 40 }: Props) {
  const imageUrl = resolveProductImageUrl(product);
  const icon = getIconByName(product.iconName || 'box');
  const iconGradient = getProductIconGradientCss(product);

  if (imageUrl) {
    return (
      <Avatar
        src={imageUrl}
        alt={product.name}
        variant="rounded"
        sx={{ width: size, height: size, borderRadius: 1.5 }}
      />
    );
  }

  return (
    <Avatar
      variant="rounded"
      sx={{
        width: size,
        height: size,
        borderRadius: 1.5,
        bgcolor: iconGradient ? 'transparent' : 'primary.main',
        background: iconGradient ?? undefined,
        color: '#fff',
      }}
    >
      {icon ? (
        <FontAwesomeIcon icon={icon} style={{ fontSize: size * 0.45 }} />
      ) : (
        <Box component="span" sx={{ fontSize: size * 0.35, fontWeight: 700 }}>
          {product.name?.slice(0, 1)?.toUpperCase() || '?'}
        </Box>
      )}
    </Avatar>
  );
}
