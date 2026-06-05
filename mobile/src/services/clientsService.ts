import { apiClient } from './apiClient'
import type { Client, ClientListResult } from '../types/client'

export const clientsService = {
  list(params: { page?: number; limit?: number; search?: string } = {}): Promise<ClientListResult> {
    return apiClient.get('/clients', params)
  },

  getById(id: string): Promise<Client> {
    return apiClient.get(`/clients/${id}`)
  },

  create(data: { name: string; email: string; phone?: string }): Promise<Client> {
    return apiClient.post('/clients', data)
  },

  delete(id: string): Promise<{ success?: boolean }> {
    return apiClient.delete(`/clients/${id}`)
  },
}
