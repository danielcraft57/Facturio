import { ApiClient } from './apiClient';
import type {
  Quote,
  QuoteLine,
  QuoteStatus,
  CreateQuoteData,
  UpdateQuoteData,
  QuoteFilters,
  QuoteListResponse,
} from '../types/quote';
import type { ApiResponse } from '../types/api';
import type { DocumentFolderCounts, DocumentFlags } from '../types/documentFolders';
import { normalizeDocumentFolderCounts } from '../types/documentFolders';
import { unwrapApiPayload } from './invoices';

export type QuotesListPageResult = {
  quotes: Quote[];
  total: number;
  page: number;
  pageSize: number;
  folderCounts?: DocumentFolderCounts;
};

export function normalizeQuoteFromApi(raw: Record<string, unknown>): Quote {
  const client = raw.client as Record<string, unknown> | undefined
  const lines = ((raw.lines as unknown[]) ?? []).map((ln) => {
    const line = ln as Record<string, unknown>
    const qty = Number(line.quantity ?? 0)
    const unit = Number(line.unitPrice ?? 0)
    const rate = Number(line.taxRate ?? 0)
    return {
      id: Number(line.id ?? 0),
      quoteId: String(line.quoteId ?? raw.id ?? ''),
      description: String(line.description ?? ''),
      quantity: qty,
      unitPrice: unit,
      taxRate: rate,
      taxAmount: Number(line.taxAmount ?? qty * unit * rate),
      total: Number(line.total ?? qty * unit * (1 + rate)),
      productId: line.productId != null ? Number(line.productId) : undefined,
    } as QuoteLine & { productId?: number }
  })
  return {
    id: String(raw.id ?? ''),
    number: String(raw.number ?? ''),
    date: String(raw.date ?? raw.createdAt ?? ''),
    expiryDate: raw.expiryDate ? String(raw.expiryDate) : undefined,
    status: String(raw.status ?? 'DRAFT') as QuoteStatus,
    clientId: String(raw.clientId ?? client?.id ?? ''),
    client: client
      ? {
          id: String(client.id),
          name: String(client.name ?? ''),
          email: String(client.email ?? ''),
          isCompany: Boolean(client.isCompany),
          isVatExempt: Boolean(client.isVatExempt),
          createdAt: String(client.createdAt ?? ''),
          updatedAt: String(client.updatedAt ?? ''),
        }
      : undefined,
    lines,
    subtotal: Number(raw.subtotal ?? 0),
    tax: Number(raw.tax ?? 0),
    total: Number(raw.total ?? 0),
    publicToken: raw.publicToken ? String(raw.publicToken) : undefined,
    sentAt: raw.sentAt ? String(raw.sentAt) : undefined,
    acceptedAt: raw.acceptedAt ? String(raw.acceptedAt) : undefined,
    invoiceId:
      raw.invoiceId != null
        ? String(raw.invoiceId)
        : (raw.convertedInvoice as Record<string, unknown> | undefined)?.id != null
          ? String((raw.convertedInvoice as Record<string, unknown>).id)
          : undefined,
    invoiceNumber:
      raw.invoiceNumber != null
        ? String(raw.invoiceNumber)
        : (raw.convertedInvoice as Record<string, unknown> | undefined)?.number != null
          ? String((raw.convertedInvoice as Record<string, unknown>).number)
          : undefined,
    createdAt: String(raw.createdAt ?? ''),
    updatedAt: String(raw.updatedAt ?? ''),
    archivedAt: raw.archivedAt ? String(raw.archivedAt) : undefined,
    starred: Boolean(raw.starred),
    important: Boolean(raw.important),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
  }
}

export function parseQuotesListPage(response: unknown): QuotesListPageResult {
  const payload = unwrapApiPayload<QuoteListResponse & { items?: Quote[] }>(response);
  const list = Array.isArray(payload?.quotes)
    ? payload.quotes
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload)
          ? (payload as Quote[])
          : [];
  return {
    quotes: list.map((row) =>
      typeof row === 'object' && row !== null
        ? normalizeQuoteFromApi(row as unknown as Record<string, unknown>)
        : (row as Quote),
    ),
    total: Number(payload?.total ?? list.length),
    page: Number(payload?.page ?? 1),
    pageSize: Number(payload?.limit ?? list.length),
    folderCounts: payload?.folderCounts
      ? normalizeDocumentFolderCounts(payload.folderCounts)
      : undefined,
  };
}

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
    if (filters?.includeFolderCounts) params.append('includeFolderCounts', '1');

    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return this.apiClient.get<QuoteListResponse>(`/devis?${params.toString()}`);
  }

  async getFolderCounts(): Promise<ApiResponse<DocumentFolderCounts>> {
    return this.apiClient.get<DocumentFolderCounts>('/devis/folder-counts');
  }

  async updateDocumentFlags(id: string, flags: DocumentFlags): Promise<ApiResponse<Quote>> {
    return this.apiClient.patch<Quote>(`/devis/${id}/document-flags`, flags);
  }

  async getQuote(id: string): Promise<Quote> {
    const response = await this.apiClient.get<Quote>(`/devis/${id}`)
    return normalizeQuoteFromApi(unwrapApiPayload<Record<string, unknown>>(response))
  }

  async createQuote(data: CreateQuoteData): Promise<ApiResponse<Quote>> {
    return this.apiClient.post<Quote>('/quotes', data);
  }

  async updateQuote(id: string, data: UpdateQuoteData): Promise<Quote> {
    const response = await this.apiClient.patch<Quote>(`/devis/${id}`, data)
    return normalizeQuoteFromApi(unwrapApiPayload<Record<string, unknown>>(response))
  }

  async archiveQuote(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.apiClient.post<{ success: boolean }>(`/devis/${id}/archive`, {});
  }

  async restoreQuote(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.apiClient.post<{ success: boolean }>(`/devis/${id}/restore`, {});
  }

  async getArchivedQuotes(): Promise<ApiResponse<unknown>> {
    return this.apiClient.get('/devis/archives');
  }

  /** @deprecated Préférer archiveQuote */
  async deleteQuote(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.archiveQuote(id);
  }

  async sendQuote(
    id: string,
    payload?: {
      to?: string
      email?: string
      updateClientEmail?: boolean
      copyToSelf?: boolean
      additionalRecipients?: string
    },
  ): Promise<
    ApiResponse<Quote & { copiesSent?: string[]; sentTo?: string; emailSent?: boolean }>
  > {
    return this.apiClient.post(`/quotes/${id}/send`, payload ?? {});
  }

  async acceptQuote(id: string): Promise<ApiResponse<Quote>> {
    return this.apiClient.post<Quote>(`/quotes/${id}/accept`);
  }

  async rejectQuote(id: string): Promise<ApiResponse<Quote>> {
    return this.apiClient.post<Quote>(`/quotes/${id}/reject`);
  }

  async convertToInvoice(id: string): Promise<ApiResponse<{ invoiceId: string }>> {
    return this.apiClient.post<{ invoiceId: string }>(`/quotes/${id}/convert-to-invoice`);
  }

  async payQuote(
    id: string,
    data: { mode: 'FULL' | 'DEPOSIT'; depositRate?: number; date?: string | Date; method?: string; notes?: string },
  ): Promise<
    ApiResponse<{
      quote?: Quote
      invoiceId: string
      invoiceNumber: string
      paymentId: number
      paymentAmount: number
      remaining: number
    }>
  > {
    return this.apiClient.post(`/quotes/${id}/pay`, data)
  }

  async remindDepositQuote(
    id: string,
  ): Promise<ApiResponse<{ success: boolean; invoiceId?: string; daysOverdue?: number | null }>> {
    return this.apiClient.post(`/quotes/${id}/remind-deposit`, {});
  }

  async getDepositContext(id: string): Promise<
    ApiResponse<{
      hasSplit: boolean
      deposit: {
        id: string
        number: string
        status: string
        total: number
        balance: number
        netPaid: number
        depositRefunded: boolean
        engagementCancelled: boolean
      } | null
      remainder: { id: string; number: string; status: string; total: number; balance: number } | null
    }>
  > {
    return this.apiClient.get(`/quotes/${id}/deposit-context`);
  }
}

export const quoteService = new QuoteService();
