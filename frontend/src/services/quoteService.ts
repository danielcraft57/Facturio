import { ApiClient } from './apiClient';
import { mockQuoteService } from './mockQuoteService';
import type { 
  Quote, 
  CreateQuoteData, 
  UpdateQuoteData, 
  QuoteFilters, 
  QuoteListResponse 
} from '../types/quote';
import type { ApiResponse } from '../types/api';

class QuoteService {
  private apiClient = ApiClient.getInstance();
  
  // Utiliser le mock en mode développement
  private useMock = import.meta.env.DEV;

  async getQuotes(filters?: QuoteFilters, page = 1, limit = 10): Promise<ApiResponse<QuoteListResponse>> {
    if (this.useMock) {
      return mockQuoteService.getQuotes(filters, page, limit);
    }
    
    const params = new URLSearchParams();
    
    if (filters?.status) params.append('status', filters.status);
    if (filters?.clientId) params.append('clientId', filters.clientId.toString());
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return this.apiClient.get<QuoteListResponse>(`/quotes?${params.toString()}`);
  }

  async getQuote(id: number): Promise<ApiResponse<Quote>> {
    if (this.useMock) {
      return mockQuoteService.getQuote(id);
    }
    return this.apiClient.get<Quote>(`/quotes/${id}`);
  }

  async createQuote(data: CreateQuoteData): Promise<ApiResponse<Quote>> {
    if (this.useMock) {
      return mockQuoteService.createQuote(data);
    }
    return this.apiClient.post<Quote>('/quotes', data);
  }

  async updateQuote(id: number, data: UpdateQuoteData): Promise<ApiResponse<Quote>> {
    if (this.useMock) {
      return mockQuoteService.updateQuote(id, data);
    }
    return this.apiClient.put<Quote>(`/quotes/${id}`, data);
  }

  async deleteQuote(id: number): Promise<ApiResponse<boolean>> {
    if (this.useMock) {
      return mockQuoteService.deleteQuote(id);
    }
    return this.apiClient.delete<boolean>(`/quotes/${id}`);
  }

  async sendQuote(id: number): Promise<ApiResponse<Quote>> {
    if (this.useMock) {
      return mockQuoteService.sendQuote(id);
    }
    return this.apiClient.post<Quote>(`/quotes/${id}/send`);
  }

  async acceptQuote(id: number): Promise<ApiResponse<Quote>> {
    if (this.useMock) {
      return mockQuoteService.acceptQuote(id);
    }
    return this.apiClient.post<Quote>(`/quotes/${id}/accept`);
  }

  async rejectQuote(id: number): Promise<ApiResponse<Quote>> {
    if (this.useMock) {
      return mockQuoteService.rejectQuote(id);
    }
    return this.apiClient.post<Quote>(`/quotes/${id}/reject`);
  }

  async convertToInvoice(id: number): Promise<ApiResponse<{ invoiceId: number }>> {
    if (this.useMock) {
      return mockQuoteService.convertToInvoice(id);
    }
    return this.apiClient.post<{ invoiceId: number }>(`/quotes/${id}/convert-to-invoice`);
  }
}

export const quoteService = new QuoteService();
