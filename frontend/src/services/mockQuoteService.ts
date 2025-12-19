import type { 
  Quote, 
  CreateQuoteData, 
  UpdateQuoteData, 
  QuoteFilters, 
  QuoteListResponse 
} from '../types/quote';
import type { ApiResponse } from '../types/api';

// Données de démonstration
const MOCK_QUOTES: Quote[] = [
  {
    id: 1,
    number: 'DEV-2024-001',
    date: '2024-01-15',
    expiryDate: '2024-02-15',
    status: 'SENT',
    clientId: 1,
    client: {
      id: 1,
      name: 'Green Energy Co',
      email: 'contact@greenenergy.com',
      address: '123 Rue de la Paix, 75001 Paris',
      isCompany: true,
      companyName: 'Green Energy Co',
      vatNumber: 'FR12345678901',
      isVatExempt: false,
      countryCode: 'FR',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15'
    },
    lines: [
      {
        id: 1,
        quoteId: 1,
        description: 'Installation panneaux solaires',
        quantity: 10,
        unitPrice: 2500,
        taxRate: 0.2,
        taxAmount: 5000,
        total: 30000
      }
    ],
    subtotal: 25000,
    tax: 5000,
    total: 30000,
    publicToken: 'token-123',
    sentAt: '2024-01-15T10:00:00Z',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15'
  },
  {
    id: 2,
    number: 'DEV-2024-002',
    date: '2024-01-20',
    expiryDate: '2024-02-20',
    status: 'ACCEPTED',
    clientId: 2,
    client: {
      id: 2,
      name: 'TechCorp Solutions',
      email: 'info@techcorp.com',
      address: '456 Avenue des Champs, 69000 Lyon',
      isCompany: true,
      companyName: 'TechCorp Solutions',
      vatNumber: 'FR98765432109',
      isVatExempt: false,
      countryCode: 'FR',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-20'
    },
    lines: [
      {
        id: 2,
        quoteId: 2,
        description: 'Développement application web',
        quantity: 1,
        unitPrice: 15000,
        taxRate: 0.2,
        taxAmount: 3000,
        total: 18000
      }
    ],
    subtotal: 15000,
    tax: 3000,
    total: 18000,
    publicToken: 'token-456',
    sentAt: '2024-01-20T14:30:00Z',
    acceptedAt: '2024-01-25T09:15:00Z',
    acceptedIp: '192.168.1.100',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-25'
  },
  {
    id: 3,
    number: 'DEV-2024-003',
    date: '2024-01-25',
    expiryDate: '2024-02-25',
    status: 'DRAFT',
    clientId: 3,
    client: {
      id: 3,
      name: 'Design Studio Pro',
      email: 'hello@designstudio.com',
      address: '789 Boulevard de la Créativité, 13000 Marseille',
      isCompany: true,
      companyName: 'Design Studio Pro',
      vatNumber: 'FR11122233344',
      isVatExempt: false,
      countryCode: 'FR',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-25'
    },
    lines: [
      {
        id: 3,
        quoteId: 3,
        description: 'Design logo et charte graphique',
        quantity: 1,
        unitPrice: 5000,
        taxRate: 0.2,
        taxAmount: 1000,
        total: 6000
      },
      {
        id: 4,
        quoteId: 3,
        description: 'Site web responsive',
        quantity: 1,
        unitPrice: 2500,
        taxRate: 0.2,
        taxAmount: 500,
        total: 3000
      }
    ],
    subtotal: 7500,
    tax: 1500,
    total: 9000,
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25'
  },
  {
    id: 4,
    number: 'DEV-2024-004',
    date: '2024-01-30',
    expiryDate: '2024-02-30',
    status: 'REJECTED',
    clientId: 4,
    client: {
      id: 4,
      name: 'Restaurant Le Gourmet',
      email: 'reservation@legourmet.com',
      address: '321 Rue de la Gastronomie, 31000 Toulouse',
      isCompany: true,
      companyName: 'Restaurant Le Gourmet',
      vatNumber: 'FR55566677788',
      isVatExempt: false,
      countryCode: 'FR',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-30'
    },
    lines: [
      {
        id: 5,
        quoteId: 4,
        description: 'Site web restaurant',
        quantity: 1,
        unitPrice: 8000,
        taxRate: 0.2,
        taxAmount: 1600,
        total: 9600
      },
      {
        id: 6,
        quoteId: 4,
        description: 'Système de réservation',
        quantity: 1,
        unitPrice: 4000,
        taxRate: 0.2,
        taxAmount: 800,
        total: 4800
      }
    ],
    subtotal: 12000,
    tax: 2400,
    total: 14400,
    publicToken: 'token-789',
    sentAt: '2024-01-30T16:45:00Z',
    createdAt: '2024-01-30',
    updatedAt: '2024-02-05'
  }
];

class MockQuoteService {
  private quotes = [...MOCK_QUOTES];

  private delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private filterQuotes(quotes: Quote[], filters?: QuoteFilters): Quote[] {
    return quotes.filter(quote => {
      if (filters?.status && quote.status !== filters.status) return false;
      if (filters?.clientId && quote.clientId !== filters.clientId) return false;
      if (filters?.dateFrom && quote.date < filters.dateFrom) return false;
      if (filters?.dateTo && quote.date > filters.dateTo) return false;
      if (filters?.search) {
        const search = filters.search.toLowerCase();
        return (
          quote.number.toLowerCase().includes(search) ||
          quote.client?.name.toLowerCase().includes(search) ||
          quote.lines.some(line => line.description.toLowerCase().includes(search))
        );
      }
      return true;
    });
  }

  async getQuotes(filters?: QuoteFilters, page = 1, limit = 10): Promise<ApiResponse<QuoteListResponse>> {
    await this.delay();
    
    const filteredQuotes = this.filterQuotes(this.quotes, filters);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedQuotes = filteredQuotes.slice(start, end);

    return {
      success: true,
      data: {
        data: paginatedQuotes,
        total: filteredQuotes.length,
        page,
        limit
      }
    };
  }

  async getQuote(id: number): Promise<ApiResponse<Quote>> {
    await this.delay();
    
    const quote = this.quotes.find(q => q.id === id);
    if (!quote) {
      return {
        success: false,
        error: 'Devis non trouvé'
      };
    }

    return {
      success: true,
      data: quote
    };
  }

  async createQuote(data: CreateQuoteData): Promise<ApiResponse<Quote>> {
    await this.delay();
    
    const newQuote: Quote = {
      id: Math.max(...this.quotes.map(q => q.id)) + 1,
      number: data.number || `DEV-2024-${String(this.quotes.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      expiryDate: data.expiryDate,
      status: data.status || 'DRAFT',
      clientId: data.clientId,
      lines: data.lines.map((line, index) => ({
        id: index + 1,
        quoteId: Math.max(...this.quotes.map(q => q.id)) + 1,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate || 0.2,
        taxAmount: line.quantity * line.unitPrice * (line.taxRate || 0.2),
        total: line.quantity * line.unitPrice * (1 + (line.taxRate || 0.2))
      })),
      subtotal: data.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0),
      tax: data.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.taxRate || 0.2), 0),
      total: data.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (1 + (line.taxRate || 0.2)), 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.quotes.unshift(newQuote);

    return {
      success: true,
      data: newQuote
    };
  }

  async updateQuote(id: number, data: UpdateQuoteData): Promise<ApiResponse<Quote>> {
    await this.delay();
    
    const index = this.quotes.findIndex(q => q.id === id);
    if (index === -1) {
      return {
        success: false,
        error: 'Devis non trouvé'
      };
    }

    const updatedQuote: Quote = { 
      ...this.quotes[index],
      number: data.number ?? this.quotes[index].number,
      clientId: data.clientId ?? this.quotes[index].clientId,
      expiryDate: data.expiryDate ?? this.quotes[index].expiryDate,
      status: data.status ?? this.quotes[index].status,
      lines: this.quotes[index].lines,
      subtotal: this.quotes[index].subtotal,
      tax: this.quotes[index].tax,
      total: this.quotes[index].total,
      updatedAt: new Date().toISOString(),
      id: this.quotes[index].id,
      date: this.quotes[index].date,
      createdAt: this.quotes[index].createdAt,
      client: this.quotes[index].client,
      publicToken: this.quotes[index].publicToken,
      sentAt: this.quotes[index].sentAt,
      acceptedAt: this.quotes[index].acceptedAt,
      acceptedIp: this.quotes[index].acceptedIp,
    };
    
    if (data.lines) {
      updatedQuote.lines = data.lines.map((line, lineIndex) => ({
        id: lineIndex + 1,
        quoteId: id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate || 0.2,
        taxAmount: line.quantity * line.unitPrice * (line.taxRate || 0.2),
        total: line.quantity * line.unitPrice * (1 + (line.taxRate || 0.2))
      }));
      updatedQuote.subtotal = data.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
      updatedQuote.tax = data.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (line.taxRate || 0.2), 0);
      updatedQuote.total = data.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice * (1 + (line.taxRate || 0.2)), 0);
    } else {
      // Garder les lignes existantes si pas de nouvelles lignes
      updatedQuote.lines = this.quotes[index].lines;
    }

    this.quotes[index] = updatedQuote;

    return {
      success: true,
      data: updatedQuote
    };
  }

  async deleteQuote(id: number): Promise<ApiResponse<boolean>> {
    await this.delay();
    
    const index = this.quotes.findIndex(q => q.id === id);
    if (index === -1) {
      return {
        success: false,
        error: 'Devis non trouvé'
      };
    }

    this.quotes.splice(index, 1);

    return {
      success: true,
      data: true
    };
  }

  async sendQuote(id: number): Promise<ApiResponse<Quote>> {
    await this.delay();
    
    const index = this.quotes.findIndex(q => q.id === id);
    if (index === -1) {
      return {
        success: false,
        error: 'Devis non trouvé'
      };
    }

    const updatedQuote = {
      ...this.quotes[index],
      status: 'SENT' as const,
      sentAt: new Date().toISOString(),
      publicToken: `token-${Math.random().toString(36).substr(2, 9)}`,
      updatedAt: new Date().toISOString()
    };

    this.quotes[index] = updatedQuote;

    return {
      success: true,
      data: updatedQuote
    };
  }

  async acceptQuote(id: number): Promise<ApiResponse<Quote>> {
    await this.delay();
    
    const index = this.quotes.findIndex(q => q.id === id);
    if (index === -1) {
      return {
        success: false,
        error: 'Devis non trouvé'
      };
    }

    const updatedQuote = {
      ...this.quotes[index],
      status: 'ACCEPTED' as const,
      acceptedAt: new Date().toISOString(),
      acceptedIp: '127.0.0.1',
      updatedAt: new Date().toISOString()
    };

    this.quotes[index] = updatedQuote;

    return {
      success: true,
      data: updatedQuote
    };
  }

  async rejectQuote(id: number): Promise<ApiResponse<Quote>> {
    await this.delay();
    
    const index = this.quotes.findIndex(q => q.id === id);
    if (index === -1) {
      return {
        success: false,
        error: 'Devis non trouvé'
      };
    }

    const updatedQuote = {
      ...this.quotes[index],
      status: 'REJECTED' as const,
      updatedAt: new Date().toISOString()
    };

    this.quotes[index] = updatedQuote;

    return {
      success: true,
      data: updatedQuote
    };
  }

  async convertToInvoice(id: number): Promise<ApiResponse<{ invoiceId: number }>> {
    await this.delay();
    
    const quote = this.quotes.find(q => q.id === id);
    if (!quote) {
      return {
        success: false,
        error: 'Devis non trouvé'
      };
    }

    // Simuler la création d'une facture
    const invoiceId = Math.floor(Math.random() * 1000) + 1;

    return {
      success: true,
      data: { invoiceId }
    };
  }
}

export const mockQuoteService = new MockQuoteService();
