import { useEffect, useState } from 'react';
import { Box, Paper, TextField, Select, MenuItem, FormControl, InputLabel, Button, Chip, IconButton, Typography, Tabs, Tab, Menu } from '@mui/material';
import { DataTable } from '../../components/DataTable';
import { useProducts, usePacks } from '../../hooks/useStores';
import type { Product, ProductKind, ProductPurpose, ProductCategory } from '../../types/product';
import type { Pack, PackType } from '../../types/pack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { EditProductDialog } from './components/EditProductDialog';
import { EditPackDialog } from './components/EditPackDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MOCK_PRODUCTS } from '../../services/productService.mock';

export function ProductsPage() {
  const productsStore = useProducts();
  const packsStore = usePacks();
  
  // États pour les produits
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<ProductKind | ''>('');
  const [purpose, setPurpose] = useState<ProductPurpose | ''>('');
  const [language, setLanguage] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productMenuAnchor, setProductMenuAnchor] = useState<null | HTMLElement>(null);
  const [productMenuRow, setProductMenuRow] = useState<Product | null>(null);
  
  // États pour les packs
  const [packSearch, setPackSearch] = useState('');
  const [packType, setPackType] = useState<PackType | ''>('');
  const [editingPack, setEditingPack] = useState<Pack | null>(null);
  const [packToDelete, setPackToDelete] = useState<Pack | null>(null);
  const [packMenuAnchor, setPackMenuAnchor] = useState<null | HTMLElement>(null);
  const [packMenuRow, setPackMenuRow] = useState<Pack | null>(null);
  
  // États partagés
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'products' | 'packs'>('products');
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createPackOpen, setCreatePackOpen] = useState(false);
  const [deleteProductOpen, setDeleteProductOpen] = useState(false);
  const [deletePackOpen, setDeletePackOpen] = useState(false);

  // Charger les données
  useEffect(() => {
    if (productsStore.isStale) productsStore.fetchProducts();
    if (packsStore.packs.length === 0) packsStore.fetchPacks();
  }, []); // Chargement initial seulement

  // Filtres produits
  useEffect(() => {
    const filters: any = {};
    if (search) filters.search = search;
    if (kind) filters.kind = kind;
    if (purpose) filters.purpose = purpose;
    if (language) filters.language = language;
    if (category) filters.category = category;
    productsStore.setFilters(filters);
    productsStore.fetchProducts(filters);
  }, [search, kind, purpose, language, category]); // Pas de productsStore dans les dépendances

  // Filtres packs
  useEffect(() => {
    const filters: any = {};
    if (packSearch) filters.search = packSearch;
    if (packType) filters.type = packType;
    packsStore.setFilters(filters);
    packsStore.fetchPacks(filters);
  }, [packSearch, packType]); // Pas de packsStore dans les dépendances

  // Colonnes pour les produits
  const productColumns = [
    {
      id: 'actions' as const,
      label: '',
      minWidth: 48,
      align: 'center' as const,
      render: (p: Product) => (
        <IconButton size="small" onClick={(e) => { setProductMenuAnchor(e.currentTarget); setProductMenuRow(p); }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      )
    },
    { id: 'name' as keyof Product, label: 'Nom', minWidth: 200 },
    { id: 'sku' as keyof Product, label: 'SKU', minWidth: 120 },
    { id: 'kind' as keyof Product, label: 'Type', minWidth: 100, render: (p: Product) => <Chip size="small" label={p.kind} /> },
    { id: 'purpose' as keyof Product, label: 'But', minWidth: 120, render: (p: Product) => p.purpose ? <Chip size="small" color="primary" label={p.purpose} /> : '-' },
    { id: 'category' as keyof Product, label: 'Catégorie', minWidth: 120, render: (p: Product) => p.category ? <Chip size="small" label={p.category} /> : '-' },
    { id: 'languages' as keyof Product, label: 'Langages', minWidth: 160, render: (p: Product) => (p.languages ?? []).join(', ') || '-' },
    { id: 'estimatedHours' as keyof Product, label: 'Heures', minWidth: 90, render: (p: Product) => (p.estimatedHours ?? 0) + ' h' },
    { id: 'unitPrice' as keyof Product, label: 'Prix', minWidth: 110, render: (p: Product) => (p.unitPrice ?? 0).toFixed(2) + ' €' },
  ];

  // Colonnes pour les packs
  const packColumns = [
    {
      id: 'actions' as const,
      label: '',
      minWidth: 48,
      align: 'center' as const,
      render: (p: Pack) => (
        <IconButton size="small" onClick={(e) => { setPackMenuAnchor(e.currentTarget); setPackMenuRow(p); }}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      )
    },
    { id: 'name' as keyof Pack, label: 'Nom', minWidth: 200 },
    { id: 'type' as keyof Pack, label: 'Type', minWidth: 120, render: (p: Pack) => <Chip size="small" label={p.type} /> },
    { id: 'description' as keyof Pack, label: 'Description', minWidth: 250 },
    { id: 'products' as keyof Pack, label: 'Produits', minWidth: 120, render: (p: Pack) => `${p.products.length} produits` },
    { id: 'totalHours' as keyof Pack, label: 'Heures', minWidth: 90, render: (p: Pack) => p.totalHours + ' h' },
    { id: 'totalPrice' as keyof Pack, label: 'Prix', minWidth: 110, render: (p: Pack) => p.totalPrice.toFixed(2) + ' €' },
  ];

  // Fonction pour obtenir les noms des produits d'un pack
  const getPackProductNames = (pack: Pack) => {
    return pack.products
      .map(id => MOCK_PRODUCTS.find((p: any) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="products" label="Produits" />
        <Tab value="packs" label="Packs" />
      </Tabs>

      {tab === 'packs' ? (
        <>
          {/* En-tête des packs */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreatePackOpen(true)}>
              Nouveau pack
            </Button>
          </Box>

          {/* Filtres des packs */}
          <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr 1fr' }, gap: 2 }}>
            <TextField 
              placeholder="Rechercher un pack..." 
              value={packSearch} 
              onChange={(e) => setPackSearch(e.target.value)} 
            />
            <FormControl>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={packType} onChange={(e) => setPackType(e.target.value as PackType | '')}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="WEBSITE">Site Web</MenuItem>
                <MenuItem value="ECOMMERCE">E-commerce</MenuItem>
                <MenuItem value="SAAS">SaaS</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" onClick={() => packsStore.fetchPacks()}>Actualiser</Button>
          </Box>

          {/* Table des packs */}
          <Paper>
            <DataTable<Pack>
              columns={packColumns as any}
              data={packsStore.packs}
              loading={packsStore.loading}
              total={packsStore.total}
              page={packsStore.page - 1}
              rowsPerPage={packsStore.limit}
              showPagination={false}
              renderExpanded={(row) => (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>{row.details}</Typography>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Produits inclus :</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {getPackProductNames(row)}
                  </Typography>
                </Box>
              )}
            />

            {/* Menu d'actions pour les packs */}
            <Menu
              anchorEl={packMenuAnchor}
              open={Boolean(packMenuAnchor)}
              onClose={() => { setPackMenuAnchor(null); setPackMenuRow(null); }}
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
                  if (packMenuRow) { setPackToDelete(packMenuRow); setDeletePackOpen(true); }
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
          {/* En-tête des produits */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateProductOpen(true)}>
              Nouveau produit
            </Button>
          </Box>

          {/* Filtres des produits */}
          <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr 2fr 2fr 2fr 1fr' }, gap: 2 }}>
            <TextField placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <FormControl>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value as ProductKind | '')}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="SAAS">SAAS</MenuItem>
                <MenuItem value="APP">APP</MenuItem>
                <MenuItem value="SERVICE">SERVICE</MenuItem>
                <MenuItem value="GOOD">GOOD</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>But</InputLabel>
              <Select label="But" value={purpose} onChange={(e) => setPurpose(e.target.value as ProductPurpose | '')}>
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="WEBSITE">WEBSITE</MenuItem>
                <MenuItem value="SAAS">SAAS</MenuItem>
                <MenuItem value="ECOMMERCE">ECOMMERCE</MenuItem>
                <MenuItem value="SHOWCASE">SHOWCASE</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Catégorie</InputLabel>
              <Select label="Catégorie" value={category} onChange={(e) => setCategory(e.target.value as ProductCategory | '')}>
                <MenuItem value="">Toutes</MenuItem>
                <MenuItem value="SETUP">SETUP</MenuItem>
                <MenuItem value="THEME">THEME</MenuItem>
                <MenuItem value="DEV">DEV</MenuItem>
                <MenuItem value="ECOMMERCE">ECOMMERCE</MenuItem>
                <MenuItem value="PAYMENT">PAYMENT</MenuItem>
                <MenuItem value="CONTENT">CONTENT</MenuItem>
                <MenuItem value="SEO">SEO</MenuItem>
                <MenuItem value="HOSTING">HOSTING</MenuItem>
                <MenuItem value="CI_CD">CI_CD</MenuItem>
                <MenuItem value="MAINTENANCE">MAINTENANCE</MenuItem>
                <MenuItem value="MOBILE">MOBILE</MenuItem>
                <MenuItem value="API">API</MenuItem>
              </Select>
            </FormControl>
            <TextField placeholder="Langage (ex: react)" value={language} onChange={(e) => setLanguage(e.target.value)} />
            <Button variant="outlined" onClick={() => productsStore.fetchProducts()}>Actualiser</Button>
          </Box>

          {/* Table des produits */}
          <Paper>
            <DataTable<Product>
              columns={productColumns as any}
              data={productsStore.products}
              loading={productsStore.isLoading}
              total={productsStore.pagination.total}
              page={productsStore.pagination.page - 1}
              rowsPerPage={productsStore.pagination.limit}
              showPagination={false}
              renderExpanded={(row) => (
                <Box>
                  {row.description && (
                    <Typography variant="body2" sx={{ mb: 1 }}>{row.description}</Typography>
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
              )}
            />

            {/* Menu d'actions pour les produits */}
            <Menu
              anchorEl={productMenuAnchor}
              open={Boolean(productMenuAnchor)}
              onClose={() => { setProductMenuAnchor(null); setProductMenuRow(null); }}
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
                  if (productMenuRow) { setProductToDelete(productMenuRow); setDeleteProductOpen(true); }
                  setProductMenuAnchor(null);
                }}
              >
                <DeleteIcon fontSize="small" style={{ marginRight: 8 }} /> Supprimer
              </MenuItem>
            </Menu>
          </Paper>
        </>
      )}

      {/* Dialogues pour les produits */}
      <EditProductDialog
        open={createProductOpen}
        product={null}
        onClose={() => setCreateProductOpen(false)}
        isSaving={saving}
        onSave={async (data) => {
          setSaving(true);
          await productsStore.createProduct(data as any);
          setSaving(false);
          setCreateProductOpen(false);
        }}
      />

      <EditProductDialog
        open={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        isSaving={saving}
        onSave={async (data) => {
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
        message={`Êtes-vous sûr de vouloir supprimer "${productToDelete?.name}" ?`}
        onConfirm={async () => {
          if (productToDelete) {
            await productsStore.deleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
          setDeleteProductOpen(false);
        }}
        onClose={() => { setDeleteProductOpen(false); setProductToDelete(null); }}
      />

      {/* Dialogues pour les packs */}
      <EditPackDialog
        open={createPackOpen}
        pack={null}
        onClose={() => setCreatePackOpen(false)}
        onSave={async (data) => {
          setSaving(true);
          await packsStore.createPack(data as any);
          setSaving(false);
          setCreatePackOpen(false);
        }}
        loading={saving}
      />

      <EditPackDialog
        open={!!editingPack}
        pack={editingPack}
        onClose={() => setEditingPack(null)}
        onSave={async (data) => {
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
        message={`Êtes-vous sûr de vouloir supprimer "${packToDelete?.name}" ?`}
        onConfirm={async () => {
          if (packToDelete) {
            await packsStore.deletePack(packToDelete.id);
            setPackToDelete(null);
          }
          setDeletePackOpen(false);
        }}
        onClose={() => { setDeletePackOpen(false); setPackToDelete(null); }}
      />
    </Box>
  );
}


