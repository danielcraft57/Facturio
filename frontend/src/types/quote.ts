import type { EmailEngagement } from '../modules/documents/documentEmailEngagement';
import type { DocumentFolder } from './documentFolders';

export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface QuoteLine {
  id: number;
  quoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Quote {
  id: string;
  number: string;
  date: string;
  expiryDate?: string;
  status: QuoteStatus;
  clientId: string;
  client?: Client;
  lines: QuoteLine[];
  subtotal: number;
  tax: number;
  total: number;
  publicToken?: string;
  sentAt?: string;
  /** Email client effectivement envoyé (événement SMTP enregistré). */
  emailSent?: boolean;
  emailOpened?: boolean;
  emailClicked?: boolean;
  emailClickAction?: string | null;
  acceptedAt?: string;
  acceptedIp?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  starred?: boolean;
  important?: boolean;
  snoozedUntil?: string;
  seenAt?: string;
  tags?: string[];
  emailEngagement?: EmailEngagement;
}

export interface CreateQuoteData {
  number?: string;
  clientId: string;
  expiryDate?: string;
  status?: QuoteStatus;
  lines: CreateQuoteLineData[];
}

export interface CreateQuoteLineData {
  productId?: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface UpdateQuoteData {
  number?: string;
  clientId?: string;
  expiryDate?: string;
  status?: QuoteStatus;
  lines?: CreateQuoteLineData[];
}

export interface QuoteFilters {
  status?: QuoteStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  folder?: DocumentFolder;
  tag?: string;
  includeFolderCounts?: boolean;
}

export interface QuoteListResponse {
  data?: Quote[];
  quotes?: Quote[];
  items?: Quote[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  folderCounts?: import('./documentFolders').DocumentFolderCounts;
}

// Import Client type
import type { Client } from './client';
