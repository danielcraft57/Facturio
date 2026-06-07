import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Invoice, CreateInvoiceData, UpdateInvoiceData, InvoiceFilters } from '../services/invoices';
import { invoiceService, normalizeInvoiceFromApi, unwrapApiPayload } from '../services/invoices';

// Types pour l'état des factures
export interface InvoicesState {
  // Données
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  
  // État de chargement
  isLoading: boolean;
  isLoadingInvoice: boolean;
  
  // Filtres et pagination
  filters: InvoiceFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  // Cache et synchronisation
  lastFetch: Date | null;
  isStale: boolean;
  
  // Actions
  fetchInvoices: (filters?: Partial<InvoiceFilters>) => Promise<void>;
  fetchInvoice: (id: string) => Promise<Invoice | null>;
  createInvoice: (data: CreateInvoiceData) => Promise<Invoice | null>;
  updateInvoice: (id: string, data: UpdateInvoiceData) => Promise<Invoice | null>;
  deleteInvoice: (id: string) => Promise<boolean>;
  sendInvoice: (id: string) => Promise<boolean>;
  markAsPaid: (id: string) => Promise<boolean>;
  cancelInvoice: (id: string) => Promise<boolean>;
  
  // Actions locales
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setFilters: (filters: Partial<InvoiceFilters>) => void;
  setPagination: (pagination: Partial<{ page: number; limit: number; total: number }>) => void;
  clearCache: () => void;
  markAsStale: () => void;
}

// Store des factures
export const useInvoicesStore = create<InvoicesState>()(
  persist(
    (set, get) => ({
      // État initial
      invoices: [],
      selectedInvoice: null,
      isLoading: false,
      isLoadingInvoice: false,
      filters: {
        search: '',
        status: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        clientId: undefined,
        sortBy: 'issueDate',
        sortOrder: 'desc',
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
      },
      lastFetch: null,
      isStale: true,

      // Actions
      fetchInvoices: async (filters?: Partial<InvoiceFilters>) => {
        const state = get();
        const newFilters = { ...state.filters, ...filters };
        const page = newFilters.page ?? state.pagination.page;
        const limit = newFilters.limit ?? state.pagination.limit;

        set({ isLoading: true, filters: newFilters });

        try {
          if (get().isStale) {
            const { apiClient } = await import('../services/api')
            apiClient.invalidateCache('/invoices')
          }
          const response = await invoiceService.getInvoices({
            ...newFilters,
            page,
            limit,
          });
          const payload = unwrapApiPayload<{
            invoices?: unknown[]
            items?: unknown[]
            total?: number
          }>(response);
          const list = payload?.invoices ?? payload?.items ?? [];
          const total = payload?.total ?? 0;

          set({
            invoices: (list || []).map((raw) =>
              normalizeInvoiceFromApi(raw as Record<string, unknown>),
            ),
            pagination: {
              ...state.pagination,
              page,
              limit,
              total,
            },
            lastFetch: new Date(),
            isStale: false,
          });
        } catch (error) {
          console.error('Erreur lors du chargement des factures:', error);
          // Garder les données en cache en cas d'erreur
        } finally {
          set({ isLoading: false });
        }
      },

      fetchInvoice: async (id: string) => {
        set({ isLoadingInvoice: true });
        
        try {
          const invoice = await invoiceService.getInvoice(id)
          set({ selectedInvoice: invoice, isLoadingInvoice: false })
          return invoice
        } catch (error) {
          console.error('Erreur lors du chargement de la facture:', error)
          set({ isLoadingInvoice: false })
          return null
        }
      },

      createInvoice: async (data: CreateInvoiceData) => {
        try {
          const response = await invoiceService.createInvoice(data);
          const newInvoice = response.data;
          if (newInvoice) {
            set((state) => ({
              invoices: [newInvoice, ...state.invoices],
              isStale: true, // Marquer comme obsolète pour forcer un refresh
            }));
          }
          return newInvoice;
        } catch (error) {
          console.error('Erreur lors de la création de la facture:', error);
          return null;
        }
      },

      updateInvoice: async (id: string, data: UpdateInvoiceData) => {
        try {
          const response = await invoiceService.updateInvoice({ ...data, id });
          const updatedInvoice = response.data;
          if (updatedInvoice) {
            set((state) => ({
              invoices: state.invoices.map(invoice => 
                invoice.id === id ? updatedInvoice : invoice
              ),
              selectedInvoice: state.selectedInvoice?.id === id ? updatedInvoice : state.selectedInvoice,
            }));
          }
          return updatedInvoice;
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la facture:', error);
          return null;
        }
      },

      deleteInvoice: async (id: string) => {
        try {
          const response = await invoiceService.deleteInvoice(id);
          const success = response.success;
          if (success) {
            set((state) => ({
              invoices: state.invoices.filter(invoice => invoice.id !== id),
              selectedInvoice: state.selectedInvoice?.id === id ? null : state.selectedInvoice,
            }));
          }
          return success;
        } catch (error) {
          console.error('Erreur lors de la suppression de la facture:', error);
          return false;
        }
      },

      sendInvoice: async (id: string) => {
        try {
          const response = await invoiceService.sendInvoice(id);
          const success = response.success;
          if (success) {
            const sentNow = new Date().toISOString()
            set((state) => ({
              invoices: state.invoices.map((invoice) =>
                invoice.id === id
                  ? {
                      ...invoice,
                      sentAt: sentNow,
                      status: invoice.status === 'paid' ? 'paid' : 'sent',
                    }
                  : invoice,
              ),
              selectedInvoice:
                state.selectedInvoice?.id === id
                  ? {
                      ...state.selectedInvoice,
                      sentAt: sentNow,
                      status:
                        state.selectedInvoice.status === 'paid' ? 'paid' : 'sent',
                    }
                  : state.selectedInvoice,
            }))
          }
          return success;
        } catch (error) {
          console.error('Erreur lors de l\'envoi de la facture:', error);
          return false;
        }
      },

      markAsPaid: async (id: string) => {
        try {
          const response = await invoiceService.markAsPaid(id);
          const success = response.success;
          if (success) {
            // Mettre à jour le statut localement
            set((state) => ({
              invoices: state.invoices.map(invoice => 
                invoice.id === id ? { ...invoice, status: 'paid' } : invoice
              ),
              selectedInvoice: state.selectedInvoice?.id === id 
                ? { ...state.selectedInvoice, status: 'paid' } 
                : state.selectedInvoice,
            }));
          }
          return success;
        } catch (error) {
          console.error('Erreur lors du marquage comme payée:', error);
          return false;
        }
      },

      cancelInvoice: async (id: string) => {
        try {
          const response = await invoiceService.cancelInvoice(id);
          const success = response.success;
          if (success) {
            // Mettre à jour le statut localement
            set((state) => ({
              invoices: state.invoices.map(invoice => 
                invoice.id === id ? { ...invoice, status: 'cancelled' } : invoice
              ),
              selectedInvoice: state.selectedInvoice?.id === id 
                ? { ...state.selectedInvoice, status: 'cancelled' } 
                : state.selectedInvoice,
            }));
          }
          return success;
        } catch (error) {
          console.error('Erreur lors de l\'annulation de la facture:', error);
          return false;
        }
      },

      // Actions locales
      setSelectedInvoice: (invoice: Invoice | null) => {
        set({ selectedInvoice: invoice });
      },

      setFilters: (filters: Partial<InvoiceFilters>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
          pagination: { ...state.pagination, page: 1 }, // Reset à la première page
        }));
      },

      setPagination: (pagination) => {
        set((state) => ({
          pagination: { ...state.pagination, ...pagination },
        }));
      },

      clearCache: () => {
        set({
          invoices: [],
          lastFetch: null,
          isStale: true,
        });
      },

      markAsStale: () => {
        set({ isStale: true });
      },
    }),
    {
      name: 'facturio-invoices-store',
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination,
        lastFetch: state.lastFetch,
      }),
    }
  )
);
