import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { productService } from '../services/productService';
import type { Product, ProductFilters, CreateProductData, UpdateProductData } from '../types/product';

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
  pagination: { page: 1, limit: 10, total: 0 },
  lastFetch: null,
  isStale: true,
};

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      async fetchProducts(filters = {}, page = 1) {
        set({ isLoading: true });
        try {
          const res = await productService.getProducts(filters, page, get().pagination.limit);
          const raw: any = res?.data ?? res;
          const list = Array.isArray(raw?.items) ? raw.items : Array.isArray(raw?.data) ? raw.data : [];
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
          if (res.success && res.data) set({ selectedProduct: res.data });
        } finally {
          set({ isLoading: false });
        }
      },

      async createProduct(data: CreateProductData) {
        set({ isCreating: true });
        try {
          const res = await productService.createProduct(data);
          if (res.success && res.data) {
            set(s => ({ products: [res.data!, ...s.products], selectedProduct: res.data! }));
            get().markAsStale();
            return res.data!;
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
          if (res.success && res.data) {
            set(s => ({
              products: s.products.map(p => (p.id === id ? res.data! : p)),
              selectedProduct: s.selectedProduct?.id === id ? res.data! : s.selectedProduct,
            }));
            get().markAsStale();
            return res.data!;
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
          if (res.success) {
            set(s => ({ products: s.products.filter(p => p.id !== id), selectedProduct: s.selectedProduct?.id === id ? null : s.selectedProduct }));
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
