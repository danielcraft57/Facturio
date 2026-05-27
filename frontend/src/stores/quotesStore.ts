import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { quoteService, parseQuotesListPage } from '../services/quoteService';
import type { Quote, QuoteFilters, CreateQuoteData, UpdateQuoteData } from '../types/quote';
import { isEntityCuid } from '../utils/entityId';

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
  fetchQuote: (id: string) => Promise<void>;
  createQuote: (data: CreateQuoteData) => Promise<Quote | null>;
  updateQuote: (id: string, data: UpdateQuoteData) => Promise<Quote | null>;
  deleteQuote: (id: string) => Promise<boolean>;
  sendQuote: (id: string) => Promise<Quote | null>;
  acceptQuote: (id: string) => Promise<{ quote: Quote; invoiceId: string | null } | null>;
  rejectQuote: (id: string) => Promise<Quote | null>;
  convertToInvoice: (id: string) => Promise<string | null>;
  payQuote: (
    id: string,
    data: { mode: 'FULL' | 'DEPOSIT'; depositRate?: number },
  ) => Promise<{ quote: Quote; invoiceId: string | null; invoiceNumber?: string } | null>;

  remindDepositQuote: (id: string) => Promise<boolean>;
  
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
          const parsed = parseQuotesListPage(res);
          set({
            quotes: parsed.quotes,
            pagination: {
              page: parsed.page,
              limit: parsed.pageSize,
              total: parsed.total,
            },
            lastFetch: Date.now(),
            isStale: false,
          });
        } catch (error) {
          console.error('Erreur lors de la récupération des devis:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchQuote: async (id: string) => {
        set({ isLoading: true });
        try {
          const quote = await quoteService.getQuote(id);
          if (quote && isEntityCuid(quote.id)) {
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
          if (quote && isEntityCuid(quote.id)) {
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

      updateQuote: async (id: string, data: UpdateQuoteData) => {
        set({ isUpdating: true });
        try {
          const res = await quoteService.updateQuote(id, data);
          const quote = (res as any)?.data ?? res;
          if (quote && isEntityCuid(quote.id)) {
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

      deleteQuote: async (id: string) => {
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

      sendQuote: async (id: string) => {
        const res = await quoteService.sendQuote(id);
        const anyRes: any = res as any;
        if (anyRes?.success === false) {
          throw new Error(anyRes?.error || "Impossible d'envoyer le devis");
        }
        const quote = anyRes?.data ?? anyRes;
        if (quote && isEntityCuid(quote.id)) {
          set((state) => ({
            quotes: state.quotes.map((q) => (q.id === id ? quote : q)),
            selectedQuote: state.selectedQuote?.id === id ? quote : state.selectedQuote,
          }));
          return quote;
        }
        return null;
      },

      acceptQuote: async (id: string) => {
        try {
          const res = await quoteService.acceptQuote(id);
          const quote = (res as any)?.data ?? res;
          if (quote && isEntityCuid(quote.id)) {
            set(state => ({
              quotes: state.quotes.map(q => (q.id === id ? quote : q)),
              selectedQuote: state.selectedQuote?.id === id ? quote : state.selectedQuote
            }));
            const invoiceId =
              quote.invoiceId != null ? String(quote.invoiceId) : null;
            return { quote, invoiceId };
          }
        } catch (error) {
          console.error('Erreur lors de l\'acceptation du devis:', error);
        }
        return null;
      },

      rejectQuote: async (id: string) => {
        try {
          const res = await quoteService.rejectQuote(id);
          const quote = (res as any)?.data ?? res;
          if (quote && isEntityCuid(quote.id)) {
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

      convertToInvoice: async (id: string) => {
        try {
          const res = await quoteService.convertToInvoice(id);
          const raw: any = (res as any)?.data ?? res;
          const invoiceId = raw?.invoiceId ?? raw?.id;
          if (invoiceId != null) {
            return String(invoiceId);
          }
        } catch (error) {
          console.error('Erreur lors de la conversion en facture:', error);
        }
        return null;
      },

      payQuote: async (id: string, data) => {
        try {
          const res = await quoteService.payQuote(id, data);
          const raw: any = (res as any)?.data ?? res;
          const quote: any = raw?.quote ?? raw;
          if (quote && isEntityCuid(quote.id)) {
            set((state) => ({
              quotes: state.quotes.map((q) => (q.id === id ? quote : q)),
              selectedQuote: state.selectedQuote?.id === id ? quote : state.selectedQuote,
            }));
            return {
              quote,
              invoiceId: raw?.invoiceId != null ? String(raw.invoiceId) : null,
              invoiceNumber: raw?.invoiceNumber != null ? String(raw.invoiceNumber) : undefined,
            };
          }
        } catch (error) {
          console.error('Erreur lors du paiement du devis:', error);
        }
        return null;
      },

      remindDepositQuote: async (id: string) => {
        try {
          const res = await quoteService.remindDepositQuote(id);
          const raw: any = (res as any)?.data ?? res;
          return Boolean(raw?.success);
        } catch (error) {
          console.error("Erreur lors de la relance acompte:", error);
          return false;
        }
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
