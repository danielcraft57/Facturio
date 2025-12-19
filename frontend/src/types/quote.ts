export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface QuoteLine {
  id: number;
  quoteId: number;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Quote {
  id: number;
  number: string;
  date: string;
  expiryDate?: string;
  status: QuoteStatus;
  clientId: number;
  client?: Client;
  lines: QuoteLine[];
  subtotal: number;
  tax: number;
  total: number;
  publicToken?: string;
  sentAt?: string;
  acceptedAt?: string;
  acceptedIp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteData {
  number?: string;
  clientId: number;
  expiryDate?: string;
  status?: QuoteStatus;
  lines: CreateQuoteLineData[];
}

export interface CreateQuoteLineData {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface UpdateQuoteData {
  number?: string;
  clientId?: number;
  expiryDate?: string;
  status?: QuoteStatus;
  lines?: CreateQuoteLineData[];
}

export interface QuoteFilters {
  status?: QuoteStatus;
  clientId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface QuoteListResponse {
  data: Quote[];
  total: number;
  page: number;
  limit: number;
}

// Import Client type
import type { Client } from './client';
