import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Fade,
  IconButton,
  Menu,
  InputAdornment,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Stack,
  Tooltip,
  Alert,
} from '@mui/material';
import { PageHeader } from '../../components/finance/PageHeader';
import { financePagePadding, financePrimaryButtonSx } from '../../components/finance/financeStyles';
import { useProducts } from '../../hooks/useStores';
import { useProductsCatalogList } from '../../hooks/useProductsCatalogList';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import type { Product } from '../../types/product';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewCompactIcon from '@mui/icons-material/ViewCompact';
import ViewStreamIcon from '@mui/icons-material/ViewStream';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { productService } from '../../services/productService';
import { EditProductDialog } from './components/EditProductDialog';
import { ProductCatalogSections } from './components/ProductCatalogSections';
import { ProductCatalogInitialLoader } from '../../components/loading/ProductCatalogInitialLoader';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/useToast';
import type { CreateProductData, UpdateProductData } from '../../types/product';
import type { FinanceRealtimeDetail, RealtimeHighlightTone } from '../../types/realtime';
import { HIGHLIGHT_DURATION_MS } from '../../utils/financeRealtimeUi';

const PRODUCT_DISPLAY_MODE_KEY = 'facturio-products-display-mode';

function loadDisplayMode(): 'catalog' | 'list' | 'compact' {
  try {
    const raw = localStorage.getItem(PRODUCT_DISPLAY_MODE_KEY);
    return raw === 'catalog' || raw === 'list' || raw === 'compact' ? raw : 'catalog';
  } catch {
    return 'catalog';
  }
}

function scoreProduct(p: Product, qTokens: string[]): number {
  const name = (p.name ?? '').toLowerCase();
  const sku = (p.sku ?? '').toLowerCase();
  const desc = (p.description ?? '').toLowerCase();
  const details = (p.details ?? []).map(d => (typeof d === 'string' ? d : d.label)).join(' ').toLowerCase();
  const cat = (p.category ?? '').toLowerCase();
  const pur = (p.purpose ?? '').toLowerCase();
  const langs = [...(p.languages ?? []), ...Object.values(p.techStack ?? {}).flat()]
    .join(' ')
    .toLowerCase();
  const hay = `${name} ${sku} ${desc} ${details} ${cat} ${pur} ${langs}`;

  let s = 0;
  for (const t of qTokens) {
    if (name === t) s += 120;
    else if (name.startsWith(t)) s += 80;
    else if (name.includes(t)) s += 45;
    if (sku.startsWith(t)) s += 60;
    else if (sku.includes(t)) s += 30;
    if (desc.includes(t)) s += 25;
    if (details.includes(t)) s += 15;
    if (langs.includes(t)) s += 12;
    if (cat.includes(t) || pur.includes(t)) s += 10;
    if (!hay.includes(t)) s -= 100;
  }
  return s;
}

type ProductsLocationState = {
  catalogRegenerated?: boolean;
  productCount?: number;
};

export function ProductsPage() {
  const productsStore = useProducts();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim().toLowerCase(), 280);
  const [searchFocused, setSearchFocused] = useState(false);
  const [displayMode, setDisplayMode] = useState<'catalog' | 'list' | 'compact'>(loadDisplayMode);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productMenuAnchor, setProductMenuAnchor] = useState<null | HTMLElement>(null);
  const [productMenuRow, setProductMenuRow] = useState<Product | null>(null);
  const [highlightProductId, setHighlightProductId] = useState<number | null>(null);
  const [highlightTone, setHighlightTone] = useState<RealtimeHighlightTone | undefined>(undefined);

  const [saving, setSaving] = useState(false);
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);

  const {
    products,
    total,
    loading,
    initialLoading,
    error,
    refresh,
    listEpoch,
    prependProduct,
    patchProduct,
    removeProduct,
  } = useProductsCatalogList(debouncedSearch);

  const contentKey = `${listEpoch}-${debouncedSearch}-${displayMode}`;
  const showProgress = loading && !initialLoading;

  const openProductMenu = (e: MouseEvent<HTMLElement>, product: Product) => {
    setProductMenuAnchor(e.currentTarget);
    setProductMenuRow(product);
  };

  const filteredProducts = useMemo(() => {
    const q = debouncedSearch;
    const qTokens = q.split(/\s+/).filter(Boolean);
    if (!qTokens.length) return products;

    return products
      .map((p) => ({ p, s: scoreProduct(p, qTokens) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name))
      .map((x) => x.p);
  }, [products, debouncedSearch]);

  const flashHighlight = (productId: number, tone: RealtimeHighlightTone = 'created') => {
    setHighlightProductId(productId);
    setHighlightTone(tone);
    window.setTimeout(() => {
      setHighlightProductId(null);
      setHighlightTone(undefined);
    }, HIGHLIGHT_DURATION_MS[tone] ?? 2600);
  };

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const regenNavKeyHandled = useRef<string | null>(null);

  useEffect(() => {
    const state = location.state as ProductsLocationState | null;
    if (!state?.catalogRegenerated) return;
    if (regenNavKeyHandled.current === location.key) return;
    regenNavKeyHandled.current = location.key;

    const count = state.productCount;
    toast.success(
      count != null ? `Catalogue régénéré — ${count} produit(s) installé(s).` : 'Catalogue régénéré.',
    );
    productsStore.markAsStale();
    productService.invalidateCatalogCache();

    void refreshRef
      .current()
      .catch(() => {
        toast.error('Catalogue mis à jour — rechargez la page si la liste semble incomplète.');
      })
      .finally(() => {
        navigate(
          { pathname: location.pathname, search: location.search },
          { replace: true, state: {} },
        );
      });
  }, [location.key, location.state, location.pathname, location.search, navigate, productsStore, toast]);

  useEffect(() => {
    const onRealtime = (ev: Event) => {
      const detail = (ev as CustomEvent<FinanceRealtimeDetail>).detail;
      if (!detail) return;
      void refreshRef.current();
      productsStore.markAsStale();
      const productId = detail.id != null ? Number(detail.id) : NaN;
      if (!Number.isNaN(productId)) {
        flashHighlight(productId, detail.tone);
      }
    };
    window.addEventListener('facturio:products-realtime', onRealtime);
    return () => window.removeEventListener('facturio:products-realtime', onRealtime);
  }, [productsStore]);

  const syncStoreCache = () => {
    productsStore.markAsStale();
  };

  const handleCreateProduct = async (data: CreateProductData | UpdateProductData) => {
    setSaving(true);
    try {
      const created = await productsStore.createProduct(data as CreateProductData);
      if (!created) {
        toast.error('Impossible de créer le produit. Vérifiez les champs et réessayez.');
        return;
      }
      if (search.trim()) setSearch('');
      prependProduct(created);
      setCreateProductOpen(false);
      flashHighlight(created.id);
      toast.success(`Produit « ${created.name} » ajouté au catalogue`);
      await refresh();
      syncStoreCache();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProduct = async (data: UpdateProductData) => {
    if (!editingProduct) return;
    setSaving(true);
    try {
      const updated = await productsStore.updateProduct(editingProduct.id, data);
      if (!updated) {
        toast.error('Impossible d’enregistrer les modifications.');
        return;
      }
      patchProduct(updated);
      setEditingProduct(null);
      flashHighlight(updated.id, 'updated');
      toast.success(`Produit « ${updated.name} » mis à jour`);
      await refresh();
      syncStoreCache();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    const { id, name } = productToDelete;
    const ok = await productsStore.deleteProduct(id);
    if (!ok) {
      toast.error('Suppression impossible.');
      return;
    }
    removeProduct(id);
    toast.success(`Produit « ${name} » supprimé`);
    setProductToDelete(null);
    setDeleteProductOpen(false);
    await refresh();
    syncStoreCache();
  };

  const productMenu = (
    <Menu
      anchorEl={productMenuAnchor}
      open={Boolean(productMenuAnchor)}
      onClose={() => {
        setProductMenuAnchor(null);
        setProductMenuRow(null);
      }}
    >
      <MenuItem
        onClick={() => {
          if (productMenuRow) setEditingProduct(productMenuRow);
          setProductMenuAnchor(null);
        }}
      >
        <EditIcon fontSize="small" style={{ marginRight: 8 }} /> Modifier
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (productMenuRow) {
            setProductToDelete(productMenuRow);
            setDeleteProductOpen(true);
          }
          setProductMenuAnchor(null);
        }}
      >
        <DeleteIcon fontSize="small" style={{ marginRight: 8 }} /> Supprimer
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ p: financePagePadding }}>
      <PageHeader
        title="Catalogue produits"
        subtitle="Recherche rapide et filtres intelligents pour retrouver tes produits en quelques secondes."
        actions={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
            <Button
              component={RouterLink}
              to="/installation?returnTo=/produits"
              variant="outlined"
              startIcon={<AutorenewIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              Régénérer catalogue
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateProductOpen(true)}
              sx={financePrimaryButtonSx}
            >
              Nouveau produit
            </Button>
          </Stack>
        }
      />

      <Box sx={{ mb: 2.5, display: 'flex', gap: 1.25, alignItems: 'center' }}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={displayMode}
          onChange={(_e, v) => v && setDisplayMode(v)}
          sx={{ flexShrink: 0 }}
        >
          <ToggleButton value="catalog" aria-label="Catalogue">
            <ViewModuleIcon fontSize="small" sx={{ mr: 0.6 }} />
            Catalogue
          </ToggleButton>
          <ToggleButton value="list" aria-label="Liste">
            <ViewStreamIcon fontSize="small" sx={{ mr: 0.6 }} />
            Liste
          </ToggleButton>
          <ToggleButton value="compact" aria-label="Compact">
            <ViewCompactIcon fontSize="small" sx={{ mr: 0.6 }} />
            Compact
          </ToggleButton>
        </ToggleButtonGroup>

        <Box
          sx={{
            flex: 1,
            p: 0.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: searchFocused ? 'primary.main' : 'divider',
            bgcolor: 'background.paper',
            boxShadow: searchFocused ? '0 12px 30px rgba(25,118,210,0.16)' : '0 2px 10px rgba(15,23,42,0.05)',
            transform: searchFocused ? 'translateY(-1px)' : 'translateY(0)',
            transition: 'all 180ms ease',
          }}
        >
          <TextField
            fullWidth
            placeholder="Recherche intelligente: nom, SKU, description, détails, techno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                '& fieldset': { border: 'none' },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')} aria-label="Effacer la recherche">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
        </Box>

        <Tooltip title="Actualiser le catalogue">
          <span>
            <IconButton
              size="small"
              onClick={() => void refresh().catch(() => toast.error('Actualisation impossible'))}
              disabled={loading}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 2, flexShrink: 0 }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: -1.5, mb: 2, px: 0.5 }}>
        {!initialLoading && !error && (
          <Typography variant="caption" color="text.secondary">
            {filteredProducts.length} resultat{filteredProducts.length > 1 ? 's' : ''} sur {total || products.length}
          </Typography>
        )}
      </Stack>

      <Box sx={{ position: 'relative', mt: 1 }}>
        {error ? (
          <Alert
            severity="error"
            sx={{ borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => void refresh().catch(() => toast.error('Actualisation impossible'))}>
                Réessayer
              </Button>
            }
          >
            {error}
          </Alert>
        ) : initialLoading ? (
          <ProductCatalogInitialLoader initial />
        ) : (
          <>
            {showProgress && (
              <LinearProgress
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 2,
                  borderRadius: '0 0 2px 2px',
                }}
              />
            )}

            <Fade key={contentKey} in timeout={{ enter: 280, exit: 160 }}>
              <Box
                sx={{
                  opacity: showProgress ? 0.72 : 1,
                  transition: 'opacity 0.22s ease',
                  pointerEvents: loading ? 'none' : 'auto',
                  pt: showProgress ? 0.5 : 0,
                }}
              >
                <ProductCatalogSections
                  products={filteredProducts}
                  onMenu={openProductMenu}
                  onCardClick={setEditingProduct}
                  mode={displayMode}
                  highlightProductId={highlightProductId}
                  highlightTone={highlightTone}
                />
              </Box>
            </Fade>
          </>
        )}
        {productMenu}
      </Box>

      <EditProductDialog
        open={createProductOpen}
        product={null}
        onClose={() => !saving && setCreateProductOpen(false)}
        isSaving={saving}
        onSave={handleCreateProduct}
      />

      <EditProductDialog
        open={!!editingProduct}
        product={editingProduct}
        onClose={() => !saving && setEditingProduct(null)}
        isSaving={saving}
        onSave={handleUpdateProduct}
      />

      <ConfirmDialog
        open={deleteProductOpen}
        title="Supprimer le produit"
        message={`Êtes-vous sûr de vouloir supprimer « ${productToDelete?.name} » ?`}
        onConfirm={handleDeleteProduct}
        onClose={() => {
          setDeleteProductOpen(false);
          setProductToDelete(null);
        }}
      />
    </Box>
  );
}
