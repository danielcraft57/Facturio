import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { productService } from '../services/productService';
import { unwrapApiPayload } from '../services/clients';
import type { Product, ProductFilters, CreateProductData, UpdateProductData } from '../types/product';
import { normalizeProductFromApi } from '../modules/products/utils/productVisual';

function parseProductResponse(res: unknown): Product | null {
  const payload = unwrapApiPayload<Record<string, unknown>>(res);
  if (!payload || payload.id == null) return null;
  return normalizeProductFromApi(payload);
}

interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  filters: ProductFilters;
  pagination: { page: number; limit: number; total: number };
  lastFetch: number | null;
  isStale: boolean;

  fetchProducts: (filters?: ProductFilters, page?: number) => Promise<void>;
  fetchProduct: (id: number) => Promise<void>;
  createProduct: (data: CreateProductData) => Promise<Product | null>;
  updateProduct: (id: number, data: UpdateProductData) => Promise<Product | null>;
  deleteProduct: (id: number) => Promise<boolean>;

  setSelectedProduct: (p: Product | null) => void;
  setFilters: (f: Partial<ProductFilters>) => void;
  clearFilters: () => void;
  markAsStale: () => void;
  clearCache: () => void;
}

const initialState = {
  products: [],
  selectedProduct: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  filters: {},
  pagination: { page: 1, limit: 48, total: 0 },
  lastFetch: null,
  isStale: true,
};

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      async fetchProducts(filters = {}, page = 1) {
        const limit = get().pagination.limit;
        const cached =
          page === 1 && !Object.keys(filters).length
            ? productService.peekCatalogCache(undefined, 1, Math.max(limit, 48))
            : null;
        if (cached?.data) {
          const raw: any = cached.data;
          const rawList = Array.isArray(raw?.items) ? raw.items : [];
          if (rawList.length > 0) {
            set({
              products: rawList.map((p: Record<string, unknown>) => normalizeProductFromApi(p)),
              pagination: {
                page: Number(raw?.page ?? 1),
                limit: Number(raw?.pageSize ?? raw?.limit ?? limit),
                total: Number(raw?.total ?? rawList.length),
              },
              lastFetch: Date.now(),
              isStale: false,
            });
          }
        }
        set({ isLoading: true });
        try {
          const res = await productService.getProducts(filters, page, limit);
          const raw: any = res?.data ?? res;
          const rawList = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.data) ? raw.data : [];
          const list = rawList.map((p: Record<string, unknown>) => normalizeProductFromApi(p));
          const total = raw?.total ?? 0;
          const pageNum = raw?.page ?? page;
          const limit = raw?.pageSize ?? raw?.limit ?? get().pagination.limit;
          if (list.length >= 0) {
            set({
              products: list,
              pagination: { page: pageNum, limit, total },
              lastFetch: Date.now(),
              isStale: false,
            });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      async fetchProduct(id: number) {
        set({ isLoading: true });
        try {
          const res = await productService.getProduct(id);
          const product = parseProductResponse(res);
          if (product) set({ selectedProduct: product });
        } finally {
          set({ isLoading: false });
        }
      },

      async createProduct(data: CreateProductData) {
        set({ isCreating: true });
        try {
          const res = await productService.createProduct(data);
          const created = parseProductResponse(res);
          if (created) {
            set(s => ({
              products: [created, ...s.products.filter(p => p.id !== created.id)],
              selectedProduct: created,
              pagination: { ...s.pagination, total: s.pagination.total + 1 },
            }));
            get().markAsStale();
            return created;
          }
        } finally {
          set({ isCreating: false });
        }
        return null;
      },

      async updateProduct(id: number, data: UpdateProductData) {
        set({ isUpdating: true });
        try {
          const res = await productService.updateProduct(id, data);
          const updated = parseProductResponse(res);
          if (updated) {
            set(s => ({
              products: s.products.map(p => (p.id === id ? updated : p)),
              selectedProduct: s.selectedProduct?.id === id ? updated : s.selectedProduct,
            }));
            get().markAsStale();
            return updated;
          }
        } finally {
          set({ isUpdating: false });
        }
        return null;
      },

      async deleteProduct(id: number) {
        set({ isDeleting: true });
        try {
          const res = await productService.deleteProduct(id);
          const raw: any = (res as any)?.data ?? res;
          const ok = raw?.success === true || raw === true;
          if (ok) {
            set(s => ({
              products: s.products.filter(p => p.id !== id),
              selectedProduct: s.selectedProduct?.id === id ? null : s.selectedProduct,
              pagination: { ...s.pagination, total: Math.max(0, s.pagination.total - 1) },
            }));
            get().markAsStale();
            return true;
          }
        } finally {
          set({ isDeleting: false });
        }
        return false;
      },

      setSelectedProduct: (p) => set({ selectedProduct: p }),
      setFilters: (f) => set(s => ({ filters: { ...s.filters, ...f }, pagination: { ...s.pagination, page: 1 } })),
      clearFilters: () => set({ filters: {}, pagination: { ...get().pagination, page: 1 } }),
      markAsStale: () => set({ isStale: true }),
      clearCache: () => set({ products: [], selectedProduct: null, lastFetch: null, isStale: true }),
    }),
    { name: 'products-store', partialize: (s) => ({ filters: s.filters, pagination: s.pagination }) }
  )
);
