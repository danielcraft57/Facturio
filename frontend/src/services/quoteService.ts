import { ApiClient } from './apiClient';
import type { 
  Quote, 
  CreateQuoteData, 
  UpdateQuoteData, 
  QuoteFilters, 
  QuoteListResponse 
} from '../types/quote';
import type { ApiResponse } from '../types/api';
import type { DocumentFolderCounts, DocumentFlags } from '../types/documentFolders';

class QuoteService {
  private apiClient = ApiClient.getInstance();

  async getQuotes(filters?: QuoteFilters, page = 1, limit = 10): Promise<ApiResponse<QuoteListResponse>> {
    const params = new URLSearchParams();
    
    if (filters?.folder) params.append('folder', filters.folder);
    if (filters?.tag) params.append('tag', filters.tag);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.clientId) params.append('clientId', filters.clientId.toString());
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return this.apiClient.get<QuoteListResponse>(`/devis?${params.toString()}`);
  }

  async getFolderCounts(): Promise<ApiResponse<DocumentFolderCounts>> {
    return this.apiClient.get<DocumentFolderCounts>('/devis/folder-counts');
  }

  async updateDocumentFlags(id: number, flags: DocumentFlags): Promise<ApiResponse<Quote>> {
    return this.apiClient.patch<Quote>(`/devis/${id}/document-flags`, flags);
  }

  async getQuote(id: number): Promise<ApiResponse<Quote>> {
    return this.apiClient.get<Quote>(`/quotes/${id}`);
  }

  async createQuote(data: CreateQuoteData): Promise<ApiResponse<Quote>> {
    return this.apiClient.post<Quote>('/quotes', data);
  }

  async updateQuote(id: number, data: UpdateQuoteData): Promise<ApiResponse<Quote>> {
    return this.apiClient.patch<Quote>(`/quotes/${id}`, data);
  }

  async archiveQuote(id: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.apiClient.post<{ success: boolean }>(`/devis/${id}/archive`, {});
  }

  async restoreQuote(id: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.apiClient.post<{ success: boolean }>(`/devis/${id}/restore`, {});
  }

  async getArchivedQuotes(): Promise<ApiResponse<unknown>> {
    return this.apiClient.get('/devis/archives');
  }

  /** @deprecated Préférer archiveQuote */
  async deleteQuote(id: number): Promise<ApiResponse<{ success: boolean }>> {
    return this.archiveQuote(id);
  }

  async sendQuote(id: number): Promise<ApiResponse<Quote>> {
    return this.apiClient.post<Quote>(`/quotes/${id}/send`);
  }

  async acceptQuote(id: number): Promise<ApiResponse<Quote>> {
    return this.apiClient.post<Quote>(`/quotes/${id}/accept`);
  }

  async rejectQuote(id: number): Promise<ApiResponse<Quote>> {
    return this.apiClient.post<Quote>(`/quotes/${id}/reject`);
  }

  async convertToInvoice(id: number): Promise<ApiResponse<{ invoiceId: number }>> {
    return this.apiClient.post<{ invoiceId: number }>(`/quotes/${id}/convert-to-invoice`);
  }
}

export const quoteService = new QuoteService();
