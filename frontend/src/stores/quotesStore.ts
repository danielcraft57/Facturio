import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { quoteService } from '../services/quoteService';
import type { Quote, QuoteFilters, CreateQuoteData, UpdateQuoteData } from '../types/quote';

interface QuotesState {
  // Data
  quotes: Quote[];
  selectedQuote: Quote | null;
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Filters and pagination
  filters: QuoteFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  // Cache management
  lastFetch: number | null;
  isStale: boolean;
  
  // Actions
  fetchQuotes: (filters?: QuoteFilters, page?: number) => Promise<void>;
  fetchQuote: (id: number) => Promise<void>;
  createQuote: (data: CreateQuoteData) => Promise<Quote | null>;
  updateQuote: (id: number, data: UpdateQuoteData) => Promise<Quote | null>;
  deleteQuote: (id: number) => Promise<boolean>;
  sendQuote: (id: number) => Promise<Quote | null>;
  acceptQuote: (id: number) => Promise<{ quote: Quote; invoiceId: number | null } | null>;
  rejectQuote: (id: number) => Promise<Quote | null>;
  convertToInvoice: (id: number) => Promise<number | null>;
  
  // State management
  setSelectedQuote: (quote: Quote | null) => void;
  setFilters: (filters: Partial<QuoteFilters>) => void;
  clearFilters: () => void;
  markAsStale: () => void;
  clearCache: () => void;
}

const initialState = {
  quotes: [],
  selectedQuote: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  },
  lastFetch: null,
  isStale: true
};

export const useQuotesStore = create<QuotesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchQuotes: async (filters = {}, page = 1) => {
        set({ isLoading: true });
        try {
          const res = await quoteService.getQuotes(filters, page, get().pagination.limit);
          const raw: any = (res as any)?.data ?? res;
          const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
          const total = raw?.total ?? list.length;
          const pageNum = raw?.page ?? page;
          const limit = raw?.limit ?? get().pagination.limit;
          set({
            quotes: list,
            pagination: { page: pageNum, limit, total },
            lastFetch: Date.now(),
            isStale: false
          });
        } catch (error) {
          console.error('Erreur lors de la récupération des devis:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchQuote: async (id: number) => {
        set({ isLoading: true });
        try {
          const res = await quoteService.getQuote(id);
          const quote = (res as any)?.data ?? res;
          if (quote && typeof quote.id === 'number') {
            set({ selectedQuote: quote });
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du devis:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      createQuote: async (data: CreateQuoteData) => {
        set({ isCreating: true });
        try {
          const res = await quoteService.createQuote(data);
          const quote = (res as any)?.data ?? res;
          if (quote && typeof quote.id === 'number') {
            set(state => ({
              quotes: [quote, ...state.quotes],
              selectedQuote: quote
            }));
            get().markAsStale();
            return quote;
          }
        } catch (error) {
          console.error('Erreur lors de la création du devis:', error);
        } finally {
          set({ isCreating: false });
        }
        return null;
      },

      updateQuote: async (id: number, data: UpdateQuoteData) => {
        set({ isUpdating: true });
        try {
          const res = await quoteService.updateQuote(id, data);
          const quote = (res as any)?.data ?? res;
          if (quote && typeof quote.id === 'number') {
            set(state => ({
              quotes: state.quotes.map(q => (q.id === id ? quote : q)),
              selectedQuote: state.selectedQuote?.id === id ? quote : state.selectedQuote
            }));
            get().markAsStale();
            return quote;
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour du devis:', error);
        } finally {
          set({ isUpdating: false });
        }
        return null;
      },

      deleteQuote: async (id: number) => {
        set({ isDeleting: true });
        try {
          await quoteService.deleteQuote(id);
          set(state => ({
            quotes: state.quotes.filter(q => q.id !== id),
            selectedQuote: state.selectedQuote?.id === id ? null : state.selectedQuote
          }));
          get().markAsStale();
          return true;
        } catch (error) {
          console.error('Erreur lors de la suppression du devis:', error);
          return false;
        } finally {
          set({ isDeleting: false });
        }
      },

      sendQuote: async (id: number) => {
        try {
          const res = await quoteService.sendQuote(id);
          const quote = (res as any)?.data ?? res;
          if (quote && typeof quote.id === 'number') {
            set(state => ({
              quotes: state.quotes.map(q => (q.id === id ? quote : q)),
              selectedQuote: state.selectedQuote?.id === id ? quote : state.selectedQuote
            }));
            return quote;
          }
        } catch (error) {
          console.error('Erreur lors de l\'envoi du devis:', error);
        }
        return null;
      },

      acceptQuote: async (id: number) => {
        try {
          const res = await quoteService.acceptQuote(id);
          const quote = (res as any)?.data ?? res;
          if (quote && typeof quote.id === 'number') {
            set(state => ({
              quotes: state.quotes.map(q => (q.id === id ? quote : q)),
              selectedQuote: state.selectedQuote?.id === id ? quote : state.selectedQuote
            }));
            const invoiceId =
              quote.invoiceId != null ? Number(quote.invoiceId) : null;
            return { quote, invoiceId };
          }
        } catch (error) {
          console.error('Erreur lors de l\'acceptation du devis:', error);
        }
        return null;
      },

      rejectQuote: async (id: number) => {
        try {
          const res = await quoteService.rejectQuote(id);
          const quote = (res as any)?.data ?? res;
          if (quote && typeof quote.id === 'number') {
            set(state => ({
              quotes: state.quotes.map(q => (q.id === id ? quote : q)),
              selectedQuote: state.selectedQuote?.id === id ? quote : state.selectedQuote
            }));
            return quote;
          }
        } catch (error) {
          console.error('Erreur lors du rejet du devis:', error);
        }
        return null;
      },

      convertToInvoice: async (id: number) => {
        try {
          const res = await quoteService.convertToInvoice(id);
          const raw: any = (res as any)?.data ?? res;
          const invoiceId = raw?.invoiceId ?? raw?.id;
          if (invoiceId != null) {
            return Number(invoiceId);
          }
        } catch (error) {
          console.error('Erreur lors de la conversion en facture:', error);
        }
        return null;
      },

      setSelectedQuote: (quote: Quote | null) => set({ selectedQuote: quote }),
      
      setFilters: (filters: Partial<QuoteFilters>) => 
        set(state => ({ 
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 }
        })),
      
      clearFilters: () => set({ filters: {}, pagination: { ...get().pagination, page: 1 } }),
      
      markAsStale: () => set({ isStale: true }),
      
      clearCache: () => set({ 
        quotes: [], 
        selectedQuote: null, 
        lastFetch: null, 
        isStale: true 
      })
    }),
    {
      name: 'quotes-store',
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination
      })
    }
  )
);
