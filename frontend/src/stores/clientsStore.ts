import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client, CreateClientData, UpdateClientData, ClientFilters } from '../services/clients';
import { clientService } from '../services/clients';

// Types pour l'état des clients
export interface ClientsState {
  // Données
  clients: Client[];
  selectedClient: Client | null;
  
  // État de chargement
  isLoading: boolean;
  isLoadingClient: boolean;
  
  // Filtres et pagination
  filters: ClientFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  // Cache et synchronisation
  lastFetch: Date | null;
  isStale: boolean;
  
  // Actions
  fetchClients: (filters?: Partial<ClientFilters>) => Promise<void>;
  fetchClient: (id: string) => Promise<Client | null>;
  createClient: (data: CreateClientData) => Promise<Client | null>;
  updateClient: (id: string, data: UpdateClientData) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<boolean>;
  searchClients: (query: string) => Promise<Client[]>;
  
  // Actions locales
  setSelectedClient: (client: Client | null) => void;
  setFilters: (filters: Partial<ClientFilters>) => void;
  setPagination: (pagination: Partial<{ page: number; limit: number; total: number }>) => void;
  clearCache: () => void;
  markAsStale: () => void;
}

// Store des clients
export const useClientsStore = create<ClientsState>()(
  persist(
    (set, get) => ({
      // État initial
      clients: [],
      selectedClient: null,
      isLoading: false,
      isLoadingClient: false,
      filters: {
        search: '',
        status: undefined,
        sortBy: 'name',
        sortOrder: 'asc',
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
      },
      lastFetch: null,
      isStale: true,

      // Actions
      fetchClients: async (filters?: Partial<ClientFilters>) => {
        const state = get();
        const newFilters = { ...state.filters, ...filters };
        
        set({ isLoading: true, filters: newFilters });
        
        try {
          const response = await clientService.getClients({
            ...newFilters,
            page: state.pagination.page,
            limit: state.pagination.limit,
          });
          
          set({
            clients: response.data.clients,
            pagination: {
              ...state.pagination,
              total: response.data.total,
            },
            lastFetch: new Date(),
            isStale: false,
          });
        } catch (error) {
          console.error('Erreur lors du chargement des clients:', error);
          // Garder les données en cache en cas d'erreur
        } finally {
          set({ isLoading: false });
        }
      },

      fetchClient: async (id: string) => {
        set({ isLoadingClient: true });
        
        try {
          const response = await clientService.getClient(id);
          const client = response.data;
          set({ selectedClient: client, isLoadingClient: false });
          return client;
        } catch (error) {
          console.error('Erreur lors du chargement du client:', error);
          set({ isLoadingClient: false });
          return null;
        }
      },

      createClient: async (data: CreateClientData) => {
        try {
          const response = await clientService.createClient(data);
          const newClient = response.data;
          if (newClient) {
            set((state) => ({
              clients: [newClient, ...state.clients],
              isStale: true, // Marquer comme obsolète pour forcer un refresh
            }));
          }
          return newClient;
        } catch (error) {
          console.error('Erreur lors de la création du client:', error);
          return null;
        }
      },

      updateClient: async (id: string, data: UpdateClientData) => {
        try {
          const response = await clientService.updateClient({ ...data, id });
          const updatedClient = response.data;
          if (updatedClient) {
            set((state) => ({
              clients: state.clients.map(client => 
                client.id === id ? updatedClient : client
              ),
              selectedClient: state.selectedClient?.id === id ? updatedClient : state.selectedClient,
            }));
          }
          return updatedClient;
        } catch (error) {
          console.error('Erreur lors de la mise à jour du client:', error);
          return null;
        }
      },

      deleteClient: async (id: string) => {
        try {
          const response = await clientService.deleteClient(id);
          const success = response.success;
          if (success) {
            set((state) => ({
              clients: state.clients.filter(client => client.id !== id),
              selectedClient: state.selectedClient?.id === id ? null : state.selectedClient,
            }));
          }
          return success;
        } catch (error) {
          console.error('Erreur lors de la suppression du client:', error);
          return false;
        }
      },

      searchClients: async (query: string) => {
        try {
          const response = await clientService.searchClients(query);
          return response.data;
        } catch (error) {
          console.error('Erreur lors de la recherche de clients:', error);
          return [];
        }
      },

      // Actions locales
      setSelectedClient: (client: Client | null) => {
        set({ selectedClient: client });
      },

      setFilters: (filters: Partial<ClientFilters>) => {
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
          clients: [],
          lastFetch: null,
          isStale: true,
        });
      },

      markAsStale: () => {
        set({ isStale: true });
      },
    }),
    {
      name: 'facturio-clients-store',
      partialize: (state) => ({
        filters: state.filters,
        pagination: state.pagination,
        lastFetch: state.lastFetch,
      }),
    }
  )
);
