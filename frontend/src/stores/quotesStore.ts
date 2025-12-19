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
  acceptQuote: (id: number) => Promise<Quote | null>;
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
          const response = await quoteService.getQuotes(filters, page, get().pagination.limit);
          if (response.success && response.data) {
            set({
              quotes: response.data.data,
              pagination: {
                page: response.data.page,
                limit: response.data.limit,
                total: response.data.total
              },
              lastFetch: Date.now(),
              isStale: false
            });
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des devis:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchQuote: async (id: number) => {
        set({ isLoading: true });
        try {
          const response = await quoteService.getQuote(id);
          if (response.success && response.data) {
            set({ selectedQuote: response.data });
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
          const response = await quoteService.createQuote(data);
          if (response.success && response.data) {
            set(state => ({
              quotes: response.data ? [response.data, ...state.quotes] : state.quotes,
              selectedQuote: response.data || null
            }));
            get().markAsStale();
            return response.data;
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
          const response = await quoteService.updateQuote(id, data);
                  if (response.success && response.data) {
          set(state => ({
            quotes: state.quotes.map(q => q.id === id ? (response.data || q) : q),
            selectedQuote: state.selectedQuote?.id === id ? (response.data || null) : state.selectedQuote
          }));
          get().markAsStale();
          return response.data;
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
          const response = await quoteService.deleteQuote(id);
          if (response.success) {
            set(state => ({
              quotes: state.quotes.filter(q => q.id !== id),
              selectedQuote: state.selectedQuote?.id === id ? null : state.selectedQuote
            }));
            get().markAsStale();
            return true;
          }
        } catch (error) {
          console.error('Erreur lors de la suppression du devis:', error);
        } finally {
          set({ isDeleting: false });
        }
        return false;
      },

      sendQuote: async (id: number) => {
        try {
          const response = await quoteService.sendQuote(id);
          if (response.success && response.data) {
            set(state => ({
              quotes: state.quotes.map(q => q.id === id ? (response.data || q) : q),
              selectedQuote: state.selectedQuote?.id === id ? (response.data || null) : state.selectedQuote
            }));
            return response.data;
          }
        } catch (error) {
          console.error('Erreur lors de l\'envoi du devis:', error);
        }
        return null;
      },

      acceptQuote: async (id: number) => {
        try {
          const response = await quoteService.acceptQuote(id);
          if (response.success && response.data) {
            set(state => ({
              quotes: state.quotes.map(q => q.id === id ? (response.data || q) : q),
              selectedQuote: state.selectedQuote?.id === id ? (response.data || null) : state.selectedQuote
            }));
            return response.data;
          }
        } catch (error) {
          console.error('Erreur lors de l\'acceptation du devis:', error);
        }
        return null;
      },

      rejectQuote: async (id: number) => {
        try {
          const response = await quoteService.rejectQuote(id);
          if (response.success && response.data) {
            set(state => ({
              quotes: state.quotes.map(q => q.id === id ? (response.data || q) : q),
              selectedQuote: state.selectedQuote?.id === id ? (response.data || null) : state.selectedQuote
            }));
            return response.data;
          }
        } catch (error) {
          console.error('Erreur lors du rejet du devis:', error);
        }
        return null;
      },

      convertToInvoice: async (id: number) => {
        try {
          const response = await quoteService.convertToInvoice(id);
          if (response.success && response.data) {
            return response.data.invoiceId;
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
