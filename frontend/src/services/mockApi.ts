import { DEMO_STATS, DEMO_CLIENTS, DEMO_INVOICES_FULL, DEMO_PRODUCTS } from '../data/demo'
import type { ClientListResponse } from './clients'
import type { InvoiceListResponse } from './invoices'

// Service pour simuler les APIs avec des données statiques
export class MockApiService {
  async get<T>(endpoint: string): Promise<T> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200))

    try {
      let data: any

      // Router vers les bonnes données selon l'endpoint
      if (endpoint === '/dashboard/stats') {
        data = {
          success: true,
          data: DEMO_STATS
        }
      } else if (endpoint.startsWith('/clients')) {
        // Simuler la pagination et les filtres
        const url = new URL(`http://localhost${endpoint}`)
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const search = url.searchParams.get('search') || ''
        const status = url.searchParams.get('status') || 'all'

        let filteredClients = DEMO_CLIENTS

        // Appliquer les filtres
        if (search) {
          filteredClients = filteredClients.filter(client =>
            client.name.toLowerCase().includes(search.toLowerCase()) ||
            client.email.toLowerCase().includes(search.toLowerCase())
          )
        }

        if (status !== 'all') {
          filteredClients = filteredClients.filter(client => client.status === status)
        }

        // Simuler la pagination
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedClients = filteredClients.slice(startIndex, endIndex)

        data = {
          success: true,
          data: {
            clients: paginatedClients,
            total: filteredClients.length,
            page,
            limit,
            totalPages: Math.ceil(filteredClients.length / limit)
          } as ClientListResponse
        }
      } else if (endpoint.startsWith('/invoices')) {
        // Simuler la pagination et les filtres
        const url = new URL(`http://localhost${endpoint}`)
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '10')
        const search = url.searchParams.get('search') || ''
        const status = url.searchParams.get('status') || 'all'

        let filteredInvoices = DEMO_INVOICES_FULL

        // Appliquer les filtres
        if (search) {
          filteredInvoices = filteredInvoices.filter(invoice =>
            invoice.number.toLowerCase().includes(search.toLowerCase()) ||
            invoice.client.name.toLowerCase().includes(search.toLowerCase())
          )
        }

        if (status !== 'all') {
          filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status)
        }

        // Simuler la pagination
        const startIndex = (page - 1) * limit
        const endIndex = startIndex + limit
        const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex)

        data = {
          success: true,
          data: {
            invoices: paginatedInvoices,
            total: filteredInvoices.length,
            page,
            limit,
            totalPages: Math.ceil(filteredInvoices.length / limit)
          } as InvoiceListResponse
        }
      } else if (endpoint.startsWith('/products')) {
        data = {
          success: true,
          data: DEMO_PRODUCTS
        }
      } else {
        throw new Error(`Endpoint non supporté: ${endpoint}`)
      }

      return data as T
    } catch (error) {
      console.error(`Erreur lors du chargement de ${endpoint}:`, error)
      throw error
    }
  }

  async post<T>(_endpoint: string, data: any): Promise<T> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 300))

    // Pour les POST, on simule juste une réponse de succès
    return {
      success: true,
      data: {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } as T
  }

  async put<T>(_endpoint: string, data: any): Promise<T> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 200))

    // Pour les PUT, on simule une mise à jour
    return {
      success: true,
      data: {
        ...data,
        updatedAt: new Date().toISOString()
      }
    } as T
  }

  async delete<T>(_endpoint: string): Promise<T> {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 100))

    // Pour les DELETE, on simule une suppression réussie
    return {
      success: true,
      data: null
    } as T
  }
}

// Instance singleton
export const mockApi = new MockApiService()
