import { useEffect, useState, type MouseEvent } from 'react';
import {
  Box,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Menu,
} from '@mui/material';
import { DataTable } from '../../components/DataTable';
import { PageHeader } from '../../components/finance/PageHeader';
import { financeCardSx, financePagePadding, financePrimaryButtonSx } from '../../components/finance/financeStyles';
import { useProducts, usePacks } from '../../hooks/useStores';
import type { Product, ProductKind, ProductPurpose, ProductCategory, ProductVisualType } from '../../types/product';
import type { Pack, PackType } from '../../types/pack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { EditProductDialog } from './components/EditProductDialog';
import { ProductAvatar } from './components/ProductAvatar';
import { ProductCatalogSections } from './components/ProductCatalogSections';
import { ProductViewToolbar, type ProductViewMode } from './components/ProductViewToolbar';
import { PURPOSE_LABELS, CATEGORY_LABELS, KIND_LABELS } from './constants/productLabels';
import { EditPackDialog } from './components/EditPackDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';

const VIEW_MODE_KEY = 'facturio-products-view';

function loadViewMode(): ProductViewMode {
  try {
    const v = localStorage.getItem(VIEW_MODE_KEY);
    return v === 'table' || v === 'catalog' ? v : 'catalog';
  } catch {
    return 'catalog';
  }
}

export function ProductsPage() {
  const productsStore = useProducts();
  const packsStore = usePacks();

  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<ProductKind | ''>('');
  const [purpose, setPurpose] = useState<ProductPurpose | ''>('');
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [visualType, setVisualType] = useState<ProductVisualType | ''>('');
  const [viewMode, setViewMode] = useState<ProductViewMode>(loadViewMode);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productMenuAnchor, setProductMenuAnchor] = useState<null | HTMLElement>(null);
  const [productMenuRow, setProductMenuRow] = useState<Product | null>(null);

  const [packSearch, setPackSearch] = useState('');
  const [packType, setPackType] = useState<PackType | ''>('');
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [packToDelete, setPackToDelete] = useState<Pack | null>(null);
  const [packMenuAnchor, setPackMenuAnchor] = useState<null | HTMLElement>(null);
  const [packMenuRow, setPackMenuRow] = useState<Pack | null>(null);

  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'products' | 'packs'>('products');
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createPackOpen, setCreatePackOpen] = useState(false);
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);
  const [deletePackOpen, setDeletePackOpen] = useState(false);

  useEffect(() => {
    if (productsStore.isStale) productsStore.fetchProducts();
    if (packsStore.packs.length === 0) packsStore.fetchPacks();
  }, []);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (search) filters.search = search;
    if (kind) filters.kind = kind;
    if (purpose) filters.purpose = purpose;
    if (language) filters.language = language;
    if (category) filters.category = category;
    if (visualType) filters.visualType = visualType;
    productsStore.setFilters(filters);
    productsStore.fetchProducts(filters);
  }, [search, kind, purpose, language, category, visualType]);

  useEffect(() => {
    const filters: Record<string, string> = {};
    if (packSearch) filters.search = packSearch;
    if (packType) filters.type = packType;
    packsStore.setFilters(filters);
    packsStore.fetchPacks(filters);
  }, [packSearch, packType]);

  const handleViewModeChange = (mode: ProductViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const openProductMenu = (e: MouseEvent<HTMLElement>, product: Product) => {
    setProductMenuAnchor(e.currentTarget);
    setProductMenuRow(product);
  };

  const productColumns = [
    {
      id: 'actions' as const,
      label: '',
      minWidth: 48,
      align: 'center' as const,
      render: (p: Product) => (
        <IconButton size="small" onClick={e => openProductMenu(e, p)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
    {
      id: 'visual' as const,
      label: '',
      minWidth: 56,
      align: 'center' as const,
      render: (p: Product) => <ProductAvatar product={p} size={36} />,
    },
    { id: 'name' as keyof Product, label: 'Nom', minWidth: 200 },
    { id: 'sku' as keyof Product, label: 'SKU', minWidth: 120 },
    {
      id: 'kind' as keyof Product,
      label: 'Type',
      minWidth: 110,
      render: (p: Product) => <Chip size="small" label={KIND_LABELS[p.kind] ?? p.kind} />,
    },
    {
      id: 'purpose' as keyof Product,
      label: 'But',
      minWidth: 120,
      render: (p: Product) =>
        p.purpose ? <Chip size="small" color="primary" label={PURPOSE_LABELS[p.purpose]} /> : '—',
    },
    {
      id: 'category' as keyof Product,
      label: 'Catégorie',
      minWidth: 130,
      render: (p: Product) =>
        p.category ? <Chip size="small" label={CATEGORY_LABELS[p.category]} /> : '—',
    },
    {
      id: 'languages' as keyof Product,
      label: 'Langages',
      minWidth: 160,
      render: (p: Product) =>
        Array.isArray(p.languages) && p.languages.length > 0 ? p.languages.join(', ') : '—',
    },
    {
      id: 'estimatedHours' as keyof Product,
      label: 'Heures',
      minWidth: 90,
      render: (p: Product) =>
        Number(p.estimatedHours ?? 0) > 0 ? `${Number(p.estimatedHours)} h` : '—',
    },
    {
      id: 'unitPrice' as keyof Product,
      label: 'Prix',
      minWidth: 110,
      render: (p: Product) => `${Number(p.unitPrice ?? 0).toFixed(2)} €`,
    },
  ];

  const packColumns = [
    {
      id: 'actions' as const,
      label: '',
      minWidth: 48,
      align: 'center' as const,
      render: (p: Pack) => (
        <IconButton
          size="small"
          onClick={e => {
            setPackMenuAnchor(e.currentTarget);
            setPackMenuRow(p);
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
    { id: 'name' as keyof Pack, label: 'Nom', minWidth: 200 },
    { id: 'type' as keyof Pack, label: 'Type', minWidth: 120, render: (p: Pack) => <Chip size="small" label={p.type} /> },
    { id: 'description' as keyof Pack, label: 'Description', minWidth: 250 },
    {
      id: 'features' as keyof Pack,
      label: 'Fonctionnalités',
      minWidth: 150,
      render: (p: Pack) => (p.features ? `${p.features.length} fonctionnalités` : '—'),
    },
    { id: 'products' as keyof Pack, label: 'Produits', minWidth: 120, render: (p: Pack) => `${p.products.length} produits` },
    {
      id: 'deliveryTime' as keyof Pack,
      label: 'Délai',
      minWidth: 90,
      render: (p: Pack) => (p.deliveryTime ? `${p.deliveryTime} jours` : '—'),
    },
    { id: 'totalHours' as keyof Pack, label: 'Heures', minWidth: 90, render: (p: Pack) => `${Number(p.totalHours ?? 0)} h` },
    { id: 'totalPrice' as keyof Pack, label: 'Prix', minWidth: 110, render: (p: Pack) => `${Number(p.totalPrice ?? 0).toFixed(2)} €` },
  ];

  const getPackProductNames = (pack: Pack) =>
    pack.products
      .map(id => productsStore.products.find(p => String(p.id) === id)?.name)
      .filter(Boolean)
      .join(', ');

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
        subtitle="Catalogue aligné sur danielcraft.fr — identité web, SEO, IA et maintenance. Tarifs indicatifs pour vos devis."
        actions={
          tab === 'products' ? (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateProductOpen(true)}
              sx={financePrimaryButtonSx}
            >
              Nouveau produit
            </Button>
          ) : (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreatePackOpen(true)} sx={financePrimaryButtonSx}>
              Nouveau pack
            </Button>
          )
        }
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="products" label="Produits" />
        <Tab value="packs" label="Packs" />
      </Tabs>

      {tab === 'packs' ? (
        <>
          <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr 1fr' }, gap: 2 }}>
            <TextField
              placeholder="Rechercher un pack…"
              value={packSearch}
              onChange={e => setPackSearch(e.target.value)}
            />
            <FormControl>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={packType} onChange={e => setPackType(e.target.value as PackType | '')}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="WEBSITE">Site web</MenuItem>
                <MenuItem value="ECOMMERCE">E-commerce</MenuItem>
                <MenuItem value="SAAS">SaaS</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={() => packsStore.fetchPacks()}>
              Actualiser
            </Button>
          </Box>

          <Paper sx={financeCardSx}>
            <DataTable<Pack>
              columns={packColumns as never}
              data={packsStore.packs}
              loading={packsStore.loading}
              total={packsStore.total}
              page={packsStore.page - 1}
              rowsPerPage={packsStore.limit}
              showPagination={false}
              renderExpanded={row => (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {row.details}
                  </Typography>
                  {row.features && row.features.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Fonctionnalités incluses
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {row.features.map((feature, index) => (
                          <Chip key={index} label={feature} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Produits inclus
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getPackProductNames(row)}
                  </Typography>
                </Box>
              )}
            />
            <Menu
              anchorEl={packMenuAnchor}
              open={Boolean(packMenuAnchor)}
              onClose={() => {
                setPackMenuAnchor(null);
                setPackMenuRow(null);
              }}
            >
              <MenuItem
                onClick={() => {
                  if (packMenuRow) setEditingPack(packMenuRow);
                  setPackMenuAnchor(null);
                }}
              >
                <EditIcon fontSize="small" style={{ marginRight: 8 }} /> Modifier
              </MenuItem>
              <MenuItem
                onClick={() => {
                  if (packMenuRow) {
                    setPackToDelete(packMenuRow);
                    setDeletePackOpen(true);
                  }
                  setPackMenuAnchor(null);
                }}
              >
                <DeleteIcon fontSize="small" style={{ marginRight: 8 }} /> Supprimer
              </MenuItem>
            </Menu>
          </Paper>
        </>
      ) : (
        <>
          <Box
            sx={{
              mb: 2,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr 1fr 1fr auto' },
              gap: 2,
            }}
          >
            <TextField placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
            <FormControl>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={kind} onChange={e => setKind(e.target.value as ProductKind | '')}>
                <MenuItem value="">Tous</MenuItem>
                {(Object.keys(KIND_LABELS) as ProductKind[]).map(k => (
                  <MenuItem key={k} value={k}>
                    {KIND_LABELS[k]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>But</InputLabel>
              <Select label="But" value={purpose} onChange={e => setPurpose(e.target.value as ProductPurpose | '')}>
                <MenuItem value="">Tous</MenuItem>
                {(Object.keys(PURPOSE_LABELS) as ProductPurpose[]).map(p => (
                  <MenuItem key={p} value={p}>
                    {PURPOSE_LABELS[p]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Catégorie</InputLabel>
              <Select label="Catégorie" value={category} onChange={e => setCategory(e.target.value as ProductCategory | '')}>
                <MenuItem value="">Toutes</MenuItem>
                {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map(c => (
                  <MenuItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              placeholder="Techno (ex. react)"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            />
            <Button variant="outlined" onClick={() => productsStore.fetchProducts()} sx={{ alignSelf: 'center' }}>
              Actualiser
            </Button>
          </Box>

          <ProductViewToolbar
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            visualType={visualType}
            onVisualTypeChange={setVisualType}
          />

          {viewMode === 'catalog' ? (
            <Box sx={{ mt: 1 }}>
              <ProductCatalogSections
                products={productsStore.products}
                loading={productsStore.isLoading}
                onMenu={openProductMenu}
                onCardClick={setEditingProduct}
              />
              {productMenu}
            </Box>
          ) : (
            <Paper sx={financeCardSx}>
              <DataTable<Product>
                columns={productColumns as never}
                data={productsStore.products}
                loading={productsStore.isLoading}
                total={productsStore.pagination.total}
                page={productsStore.pagination.page - 1}
                rowsPerPage={productsStore.pagination.limit}
                showPagination={false}
                renderExpanded={row => (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <ProductAvatar product={row} size={80} />
                    <Box sx={{ flex: 1 }}>
                      {row.description && (
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {row.description}
                        </Typography>
                      )}
                      {Array.isArray(row.details) && row.details.length > 0 && (
                        <Box component="ul" sx={{ m: 0, pl: 3 }}>
                          {row.details.map((d, i) => (
                            <li key={i}>
                              <Typography variant="body2">{d}</Typography>
                            </li>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              />
              {productMenu}
            </Paper>
          )}
        </>
      )}

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

      <EditPackDialog
        open={createPackOpen}
        pack={null}
        onClose={() => setCreatePackOpen(false)}
        onSave={async data => {
          setSaving(true);
          await packsStore.createPack(data as never);
          setSaving(false);
          setCreatePackOpen(false);
        }}
        loading={saving}
      />

      <EditPackDialog
        open={!!editingPack}
        pack={editingPack}
        onClose={() => setEditingPack(null)}
        onSave={async data => {
          if (!editingPack) return;
          setSaving(true);
          await packsStore.updatePack(editingPack.id, data);
          setSaving(false);
          setEditingPack(null);
        }}
        loading={saving}
      />

      <ConfirmDialog
        open={deletePackOpen}
        title="Supprimer le pack"
        message={`Êtes-vous sûr de vouloir supprimer « ${packToDelete?.name} » ?`}
        onConfirm={async () => {
          if (packToDelete) {
            await packsStore.deletePack(packToDelete.id);
            setPackToDelete(null);
          }
          setDeletePackOpen(false);
        }}
        onClose={() => {
          setDeletePackOpen(false);
          setPackToDelete(null);
        }}
      />
    </Box>
  );
}
