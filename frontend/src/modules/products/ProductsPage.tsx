import { useEffect, useState } from 'react';
import { Box, Paper, TextField, Select, MenuItem, FormControl, InputLabel, Button, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { DataTable } from '../../components/DataTable';
import { useProducts } from '../../hooks/useStores';
import type { Product, ProductKind, ProductPurpose } from '../../types/product';
// no dates for products modules
import EditIcon from '@mui/icons-material/Edit';
import { EditProductDialog } from './components/EditProductDialog';

export function ProductsPage() {
  const productsStore = useProducts();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<ProductKind | ''>('');
  const [purpose, setPurpose] = useState<ProductPurpose | ''>('');
  const [language, setLanguage] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (productsStore.isStale) productsStore.fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filters: any = {};
    if (search) filters.search = search;
    if (kind) filters.kind = kind;
    if (purpose) filters.purpose = purpose;
    if (language) filters.language = language;
    productsStore.setFilters(filters);
    productsStore.fetchProducts(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, kind]);

  const columns = [
    { id: 'name' as keyof Product, label: 'Nom', minWidth: 200 },
    { id: 'sku' as keyof Product, label: 'SKU', minWidth: 120 },
    { id: 'kind' as keyof Product, label: 'Type', minWidth: 100, render: (p: Product) => <Chip size="small" label={p.kind} /> },
    { id: 'purpose' as keyof Product, label: 'But', minWidth: 120, render: (p: Product) => p.purpose ? <Chip size="small" color="primary" label={p.purpose} /> : '-' },
    { id: 'languages' as keyof Product, label: 'Langages', minWidth: 160, render: (p: Product) => (p.languages ?? []).join(', ') || '-' },
    { id: 'estimatedHours' as keyof Product, label: 'Heures', minWidth: 90, render: (p: Product) => (p.estimatedHours ?? 0) + ' h' },
    { id: 'unitPrice' as keyof Product, label: 'Prix', minWidth: 110, render: (p: Product) => (p.unitPrice ?? 0).toFixed(2) + ' €' },
    { id: 'actions' as const, label: 'Actions', minWidth: 80, align: 'center' as const, render: (p: Product) => (
      <Tooltip title="Modifier">
        <IconButton size="small" onClick={() => setEditing(p)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ) },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr 2fr 2fr 1fr' }, gap: 2 }}>
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
        <TextField placeholder="Langage (ex: react)" value={language} onChange={(e) => setLanguage(e.target.value)} />
        <Button variant="outlined" onClick={() => productsStore.fetchProducts()}>Actualiser</Button>
      </Box>

      <Paper>
        <DataTable<Product>
          columns={columns as any}
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
      </Paper>

      <EditProductDialog
        open={!!editing}
        product={editing}
        onClose={() => setEditing(null)}
        isSaving={saving}
        onSave={async (data) => {
          if (!editing) return;
          setSaving(true);
          await productsStore.updateProduct(editing.id, data);
          setSaving(false);
          setEditing(null);
        }}
      />
    </Box>
  );
}


