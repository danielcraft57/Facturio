import { useEffect, useMemo, useState, type MouseEvent } from 'react';
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
} from '@mui/material';
import { PageHeader } from '../../components/finance/PageHeader';
import { financePagePadding, financePrimaryButtonSx } from '../../components/finance/financeStyles';
import { useProducts } from '../../hooks/useStores';
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
import { EditProductDialog } from './components/EditProductDialog';
import { ProductCatalogSections } from './components/ProductCatalogSections';
import { ConfirmDialog } from '../../components/ConfirmDialog';

const PRODUCT_DISPLAY_MODE_KEY = 'facturio-products-display-mode';

function loadDisplayMode(): 'catalog' | 'list' | 'compact' {
  try {
    const raw = localStorage.getItem(PRODUCT_DISPLAY_MODE_KEY);
    return raw === 'catalog' || raw === 'list' || raw === 'compact' ? raw : 'catalog';
  } catch {
    return 'catalog';
  }
}

export function ProductsPage() {
  const productsStore = useProducts();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [displayMode, setDisplayMode] = useState<'catalog' | 'list' | 'compact'>(loadDisplayMode);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productMenuAnchor, setProductMenuAnchor] = useState<null | HTMLElement>(null);
  const [productMenuRow, setProductMenuRow] = useState<Product | null>(null);

  const [saving, setSaving] = useState(false);
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);

  useEffect(() => {
    productsStore.fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 180);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    try {
      localStorage.setItem(PRODUCT_DISPLAY_MODE_KEY, displayMode);
    } catch {
      // ignore storage failures
    }
  }, [displayMode]);

  const openProductMenu = (e: MouseEvent<HTMLElement>, product: Product) => {
    setProductMenuAnchor(e.currentTarget);
    setProductMenuRow(product);
  };

  const filteredProducts = useMemo(() => {
    const q = debouncedSearch;
    const qTokens = q.split(/\s+/).filter(Boolean);
    if (!q) return productsStore.products;

    const score = (p: Product): number => {
      const name = (p.name ?? '').toLowerCase();
      const sku = (p.sku ?? '').toLowerCase();
      const desc = (p.description ?? '').toLowerCase();
      const details = (p.details ?? []).join(' ').toLowerCase();
      const cat = (p.category ?? '').toLowerCase();
      const pur = (p.purpose ?? '').toLowerCase();
      const langs = (p.languages ?? []).join(' ').toLowerCase();
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
    };

    return productsStore.products
      .map((p) => ({ p, s: score(p) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name))
      .map((x) => x.p);
  }, [productsStore.products, debouncedSearch]);

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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateProductOpen(true)}
            sx={financePrimaryButtonSx}
          >
            Nouveau produit
          </Button>
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
      </Box>
      <Fade in timeout={180}>
        <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5, mb: 2, display: 'block', px: 0.5 }}>
          {filteredProducts.length} resultat{filteredProducts.length > 1 ? 's' : ''} sur {productsStore.products.length}
        </Typography>
      </Fade>

      <Box sx={{ mt: 1 }}>
        <ProductCatalogSections
          products={filteredProducts}
          loading={productsStore.isLoading}
          onMenu={openProductMenu}
          onCardClick={setEditingProduct}
          mode={displayMode}
        />
        {productMenu}
      </Box>

      <EditProductDialog
        open={createProductOpen}
        product={null}
        onClose={() => setCreateProductOpen(false)}
        isSaving={saving}
        onSave={async data => {
          setSaving(true);
          await productsStore.createProduct(data as never);
          setSaving(false);
          setCreateProductOpen(false);
        }}
      />

      <EditProductDialog
        open={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        isSaving={saving}
        onSave={async data => {
          if (!editingProduct) return;
          setSaving(true);
          await productsStore.updateProduct(editingProduct.id, data);
          setSaving(false);
          setEditingProduct(null);
        }}
      />

      <ConfirmDialog
        open={deleteProductOpen}
        title="Supprimer le produit"
        message={`Êtes-vous sûr de vouloir supprimer « ${productToDelete?.name} » ?`}
        onConfirm={async () => {
          if (productToDelete) {
            await productsStore.deleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
          setDeleteProductOpen(false);
        }}
        onClose={() => {
          setDeleteProductOpen(false);
          setProductToDelete(null);
        }}
      />

    </Box>
  );
}
