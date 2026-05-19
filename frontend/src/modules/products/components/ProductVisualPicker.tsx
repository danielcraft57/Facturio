import { useRef, useState, useMemo } from 'react';
import {
  Box,
  Tab,
  Tabs,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Paper,
  Alert,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faWandMagicSparkles,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import type { ProductKind, ProductVisualType } from '../../../types/product';
import { PRODUCT_ICON_OPTIONS } from '../constants/productIconOptions';
import { PRODUCT_VISUAL_LIBRARY, getLibraryImageData } from '../constants/productVisualLibrary';
import { generateProductImage, downloadDataUrl } from '../utils/generateProductImage';
import { resolveProductImageUrl } from '../utils/productVisual';

const MAX_UPLOAD_BYTES = 512 * 1024;

type Props = {
  name: string;
  kind: ProductKind;
  visualType: ProductVisualType;
  iconName: string;
  imageData?: string;
  onChange: (patch: { visualType: ProductVisualType; iconName?: string; imageData?: string }) => void;
};

export function ProductVisualPicker({ name, kind, visualType, iconName, imageData, onChange }: Props) {
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const previewProduct = { name, visualType, iconName, imageData };
  const previewUrl = resolveProductImageUrl(previewProduct);

  const tabForType: Record<ProductVisualType, number> = { icon: 0, library: 1, custom: 2 };
  const activeTab = useMemo(() => tabForType[visualType] ?? 0, [visualType]);

  const handleTab = (_: unknown, v: number) => {
    setUploadError('');
    if (v === 0) onChange({ visualType: 'icon', iconName: iconName || 'box', imageData: undefined });
    if (v === 1) onChange({ visualType: 'library', imageData: imageData?.startsWith('library:') ? imageData : PRODUCT_VISUAL_LIBRARY[0].id });
    if (v === 2 && !imageData?.startsWith('data:')) {
      const generated = generateProductImage(name || 'Produit', kind);
      onChange({ visualType: 'custom', imageData: generated });
    }
  };

  const handleUpload = (file: File) => {
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError('Format non supporté. Utilisez PNG, JPG ou WebP.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError('Image trop volumineuse (max 512 Ko).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ visualType: 'custom', imageData: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    const dataUrl = generateProductImage(name || 'Produit', kind);
    onChange({ visualType: 'custom', imageData: dataUrl });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Paper
          elevation={0}
          sx={{
            width: 88,
            height: 88,
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {previewUrl ? (
            <Box component="img" src={previewUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <FontAwesomeIcon
              icon={PRODUCT_ICON_OPTIONS.find(o => o.name === iconName)?.icon ?? PRODUCT_ICON_OPTIONS[0].icon}
              style={{ fontSize: 36, opacity: 0.85 }}
            />
          )}
        </Paper>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2">Aperçu catalogue</Typography>
          <Typography variant="body2" color="text.secondary">
            Choisissez une icône, une illustration de la bibliothèque, ou importez / générez une image.
          </Typography>
          {previewUrl && (
            <Tooltip title="Télécharger l'image">
              <IconButton
                size="small"
                sx={{ mt: 0.5 }}
                onClick={() => downloadDataUrl(previewUrl, `${(name || 'produit').replace(/\s+/g, '-').toLowerCase()}.png`)}
              >
                <FontAwesomeIcon icon={faDownload} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={handleTab} variant="fullWidth" sx={{ mb: 2 }}>
        <Tab label="Icônes" icon={<FontAwesomeIcon icon={PRODUCT_ICON_OPTIONS[1].icon} />} iconPosition="start" />
        <Tab label="Bibliothèque" icon={<FontAwesomeIcon icon={PRODUCT_ICON_OPTIONS[6].icon} />} iconPosition="start" />
        <Tab label="Image" icon={<FontAwesomeIcon icon={faUpload} />} iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
            gap: 1,
            maxHeight: 220,
            overflowY: 'auto',
            pr: 0.5,
          }}
        >
          {PRODUCT_ICON_OPTIONS.map(opt => (
            <Paper
              key={opt.name}
              elevation={0}
              onClick={() => onChange({ visualType: 'icon', iconName: opt.name, imageData: undefined })}
              sx={{
                p: 1.5,
                textAlign: 'center',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: visualType === 'icon' && iconName === opt.name ? 'primary.main' : 'divider',
                bgcolor: visualType === 'icon' && iconName === opt.name ? 'action.selected' : 'background.paper',
                borderRadius: 1.5,
                transition: 'border-color 0.15s',
                '&:hover': { borderColor: 'primary.light' },
              }}
            >
              <FontAwesomeIcon icon={opt.icon} style={{ fontSize: 22 }} />
              <Typography variant="caption" display="block" sx={{ mt: 0.5, lineHeight: 1.2 }}>
                {opt.label}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {activeTab === 1 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 1.5,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {PRODUCT_VISUAL_LIBRARY.map(item => {
            const src = getLibraryImageData(item.id);
            const selected = visualType === 'library' && imageData === item.id;
            return (
              <Paper
                key={item.id}
                elevation={0}
                onClick={() => onChange({ visualType: 'library', imageData: item.id })}
                sx={{
                  p: 1,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  borderRadius: 1.5,
                  textAlign: 'center',
                  '&:hover': { borderColor: 'primary.light' },
                }}
              >
                <Box component="img" src={src} alt={item.label} sx={{ width: '100%', borderRadius: 1 }} />
                <Typography variant="caption">{item.label}</Typography>
              </Paper>
            );
          })}
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />
          <Button variant="outlined" startIcon={<FontAwesomeIcon icon={faUpload} />} onClick={() => fileRef.current?.click()}>
            Importer une image
          </Button>
          <Button variant="contained" startIcon={<FontAwesomeIcon icon={faWandMagicSparkles} />} onClick={handleGenerate}>
            Générer une vignette
          </Button>
          {uploadError && <Alert severity="warning" sx={{ width: '100%' }}>{uploadError}</Alert>}
          {visualType === 'custom' && imageData?.startsWith('data:') && (
            <Box component="img" src={imageData} alt="Aperçu" sx={{ maxWidth: 160, borderRadius: 2, boxShadow: 2 }} />
          )}
        </Box>
      )}
    </Box>
  );
}
